export enum status {
    CREATED,
    READ,
    UPDATED,
    DELETED,
    NOTFOUND,
    UNAUTHORIZED,
    ERROR,
    BADREQUEST,
    INTERNAL
}

export const HTTP = [
    201, // CREATED
    200, // READ
    204, // UPDATED
    204, // DELETED
    404, // NOTFOUND
    401, // UNAUTHORIZED
    200, // ERROR
    400, // BADREQUEST
    500, // INTERNAL
]