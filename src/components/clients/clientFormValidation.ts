const CLIENT_NAME_MAX_LENGTH = 120;

type ClientFormInput = {
    name: string;
};

type ClientFormValidationResult =
    | { data: ClientFormInput; error: '' }
    | { data: null; error: string };

function validateClientForm(input: ClientFormInput): ClientFormValidationResult {
    const name = input.name.trim();

    if (!name) {
        return {
            data: null,
            error: 'Enter a client name.'
        };
    }

    if (name.length > CLIENT_NAME_MAX_LENGTH) {
        return {
            data: null,
            error: `Client name must be ${CLIENT_NAME_MAX_LENGTH} characters or fewer.`
        };
    }

    return {
        data: { name },
        error: ''
    };
}

export { CLIENT_NAME_MAX_LENGTH, validateClientForm };
