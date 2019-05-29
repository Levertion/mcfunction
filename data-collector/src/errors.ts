import { ID } from "minecraft-id";
import { Resources } from "./types/data";

export enum ErrorKind {
    /**
     * Represents a (fatal) parsing error in the JSON structure
     * of anything
     */
    INVALID_JSON,
    INVALID_TAG_MEMBERS,
    LOOPING_TAG,
    INVALID_TAG_DEPENDENCY
}

export interface ErrorReporter {
    addError(file: string, error: Error): void;
    removeError(file: string, kind: ErrorKind): void;
}

export type Error = InvalidJSON | TagError;

export interface InvalidJSON {
    kind: ErrorKind.INVALID_JSON;
    /**
     * The error message from JSON.parse
     */
    message: string;
}

export interface TagError {
    kind:
        | ErrorKind.LOOPING_TAG
        | ErrorKind.INVALID_TAG_MEMBERS
        | ErrorKind.INVALID_TAG_DEPENDENCY;
    ids: ID[];
    resource: keyof Resources;
}
