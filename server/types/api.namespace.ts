export namespace TimeCapsuleAPI {
    export interface StandardResponse<T = any> {
        success: boolean;
        data?: T;
        message?: string;
    }
    export interface ErrorResponse {
        success: boolean;
        error: string;
        type?: string;
    }
}
