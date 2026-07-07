const PROJECT_NAME_MAX_LENGTH = 120;
const PROJECT_URL_MAX_LENGTH = 2048;
const PROJECT_URL_PATTERN = 'https?://.+';

type ProjectFormInput = {
    name: string;
    url: string;
};

type ProjectFormValidationResult =
    | {
          data: ProjectFormInput;
          error: '';
      }
    | {
          data: null;
          error: string;
      };

function validateProjectForm(input: ProjectFormInput): ProjectFormValidationResult {
    const name = input.name.trim();
    const url = input.url.trim();

    if (!name) {
        return {
            data: null,
            error: 'Enter a project name.'
        };
    }

    if (name.length > PROJECT_NAME_MAX_LENGTH) {
        return {
            data: null,
            error: `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`
        };
    }

    if (!url) {
        return {
            data: null,
            error: 'Enter a project URL.'
        };
    }

    if (url.length > PROJECT_URL_MAX_LENGTH) {
        return {
            data: null,
            error: `Project URL must be ${PROJECT_URL_MAX_LENGTH} characters or fewer.`
        };
    }

    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return {
                data: null,
                error: 'Enter a project URL starting with http:// or https://.'
            };
        }
    } catch {
        return {
            data: null,
            error: 'Enter a valid project URL.'
        };
    }

    return {
        data: {
            name,
            url
        },
        error: ''
    };
}

export {
    PROJECT_NAME_MAX_LENGTH,
    PROJECT_URL_MAX_LENGTH,
    PROJECT_URL_PATTERN,
    validateProjectForm
};
