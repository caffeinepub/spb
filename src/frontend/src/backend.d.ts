import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UserId = Principal;
export interface ClassBlock {
    startTime: bigint;
    endTime: bigint;
    days: Array<bigint>;
    name: string;
}
export interface RoutineBlockInput {
    startTime: bigint;
    endTime: bigint;
    blockLabel: string;
    category: string;
}
export interface RoutineBlock {
    id: bigint;
    startTime: bigint;
    endTime: bigint;
    blockLabel: string;
    category: string;
}
export interface UserProfile {
    sleepTime: bigint;
    wakeTime: bigint;
}
export type DateInt = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClasses(userId: UserId): Promise<Array<ClassBlock>>;
    getCompletions(userId: UserId, dateInt: DateInt): Promise<Array<bigint>>;
    getProfile(userId: UserId): Promise<UserProfile | null>;
    getRoutines(userId: UserId): Promise<Array<RoutineBlock>>;
    getUserData(userId: UserId): Promise<{
        classBlocks: Array<ClassBlock>;
        profile?: UserProfile;
        routineBlocks: Array<RoutineBlock>;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveClasses(classList: Array<ClassBlock>): Promise<void>;
    saveCompletions(dateInt: DateInt, routineIds: Array<bigint>): Promise<void>;
    saveProfile(profile: UserProfile): Promise<void>;
    saveRoutines(routineBlocks: Array<RoutineBlockInput>): Promise<void>;
}
