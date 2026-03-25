import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Module for RoutineBlock comparison
  module RoutineBlock {
    public func compare(a : RoutineBlock, b : RoutineBlock) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // Types definition
  public type UserId = Principal;
  public type DateInt = Nat;

  // Module for tuple comparison
  module TupleKey {
    public type TupleKey = (UserId, DateInt);
    public func compare(x : TupleKey, y : TupleKey) : Order.Order {
      switch (Principal.compare(x.0, y.0)) {
        case (#equal) { Nat.compare(x.1, y.1) };
        case (order) { order };
      };
    };
  };

  public type UserProfile = {
    wakeTime : Nat; // minutes from midnight
    sleepTime : Nat; // minutes from midnight
  };

  public type ClassBlock = {
    name : Text;
    days : [Nat]; // 0 = Sunday, 1 = Monday, etc.
    startTime : Nat; // minutes from midnight
    endTime : Nat; // minutes from midnight
  };

  public type RoutineBlock = {
    id : Nat;
    blockLabel : Text;
    category : Text; // e.g., "study", "exercise"
    startTime : Nat; // minutes from midnight
    endTime : Nat; // minutes from midnight
  };

  public type Completion = {
    userId : UserId;
    date : DateInt;
    routineIds : [Nat];
  };

  // Authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent storage structures
  let profiles = Map.empty<UserId, UserProfile>();
  let classes = Map.empty<UserId, [ClassBlock]>();
  let routines = Map.empty<UserId, [RoutineBlock]>();
  let completions = Map.empty<(UserId, DateInt), [Nat]>();

  // Profile functions (required naming convention)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  // Legacy profile functions (for backward compatibility)
  public query ({ caller }) func getProfile(userId : UserId) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(userId);
  };

  public shared ({ caller }) func saveProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  // Class functions
  public query ({ caller }) func getClasses(userId : UserId) : async [ClassBlock] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view classes");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own classes");
    };
    switch (classes.get(userId)) {
      case (null) { [] };
      case (?classList) { classList };
    };
  };

  public shared ({ caller }) func saveClasses(classList : [ClassBlock]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save classes");
    };
    classes.add(caller, classList);
  };

  // Routine functions
  public type RoutineBlockInput = {
    blockLabel : Text;
    category : Text;
    startTime : Nat;
    endTime : Nat;
  };

  public query ({ caller }) func getRoutines(userId : UserId) : async [RoutineBlock] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view routines");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own routines");
    };
    switch (routines.get(userId)) {
      case (null) { [] };
      case (?routineList) { routineList };
    };
  };

  public shared ({ caller }) func saveRoutines(routineBlocks : [RoutineBlockInput]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save routines");
    };
    let currentRoutines = switch (routines.get(caller)) {
      case (null) { [] };
      case (?existing) { existing };
    };

    let nextId = Nat.max(
      currentRoutines.foldLeft(
        0,
        func(acc, block) { Nat.max(acc, block.id) },
      ),
      0,
    ) + 1;

    let orderedBlocks = routineBlocks.enumerate().map(
      func((i, block)) {
        {
          id = nextId + i;
          blockLabel = block.blockLabel;
          category = block.category;
          startTime = block.startTime;
          endTime = block.endTime;
        };
      }
    ).toArray();

    routines.add(caller, orderedBlocks.sort());
  };

  // Completion functions
  public query ({ caller }) func getCompletions(userId : UserId, dateInt : DateInt) : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view completions");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own completions");
    };
    switch (completions.get((userId, dateInt))) {
      case (null) { [] };
      case (?routineIds) { routineIds };
    };
  };

  public shared ({ caller }) func saveCompletions(dateInt : DateInt, routineIds : [Nat]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save completions");
    };
    completions.add((caller, dateInt), routineIds);
  };

  // Utility function to get all user profile and routine data
  public query ({ caller }) func getUserData(userId : UserId) : async {
    profile : ?UserProfile;
    classBlocks : [ClassBlock];
    routineBlocks : [RoutineBlock];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view user data");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only users can view user data");
    };
    {
      profile = profiles.get(userId);
      classBlocks = switch (classes.get(userId)) {
        case (null) { [] };
        case (?classList) { classList };
      };
      routineBlocks = switch (routines.get(userId)) {
        case (null) { [] };
        case (?routineList) { routineList };
      };
    };
  };
};
