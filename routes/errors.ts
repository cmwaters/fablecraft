// Perhaps move this to services
export const errors = {
    NoUserAuthenticated: "no user authenticated",
    NoStoryID: "no story id provided",
    InvalidArguments: "request has invalid arguments",
    StoryNotFound: "story not found",
    UserPermissionDenied: "user does not have permission", 
    UserNotFound: "user could not be found",
    CardAlreadyExists: "card with exact story, depth and index already exists",
    CardNotFound: "card could not be found", 
    MissingTitle: "story is missing title",
    DeletingFinalRootCard: "can not delete final root card",
    UpperCardBound: "top card in column. Unable to move up", 
    LowerCardBound: "bottom card in column. Unable to move down",
    DataInconsistency: "data corrupted: card referenced a card that no longer exists",
}