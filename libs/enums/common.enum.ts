/** Mirrors backend Message enum: these texts come back as GraphQL error messages. */
export enum Message {
	SOMETHING_WENT_WRONG = 'Something went wrong!',
	NO_DATA_FOUND = 'No data found!',
	CREATE_FAILED = 'Create failed!',
	UPDATE_FAILED = 'Update failed!',
	REMOVE_FAILED = 'Remove failed!',
	UPLOAD_FAILED = 'Upload failed!',

	NOT_AUTHENTICATED = 'You are not authenticated, please login first!',
	INSERT_ALL_INPUTS = 'Please fill in all required fields!',
	PROVIDE_ALLOWED_FORMAT = 'Please provide jpg, jpeg, png or webp images!',
}

/** GraphQL sends enum NAMES, so the client uses strings (backend maps them to 1 / -1). */
export enum Direction {
	ASC = 'ASC',
	DESC = 'DESC',
}
