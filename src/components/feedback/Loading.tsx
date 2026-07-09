type LoadingSize = 'small' | 'medium' | 'large';

type LoadingProps = {
    label?: string;
    description?: string;
    size?: LoadingSize;
    centred?: boolean;
};

function Loading({
    label = 'Connecting to Site Score...',
    description,
    size = 'medium',
    centred = false
}: LoadingProps) {
    return (
        <div
            className={`loading loading--${size}${centred ? ' loading--centred' : ''}`}
            role='status'
            aria-live='polite'
        >
            <span className='loading__spinner' aria-hidden='true' />
            <span className='loading__content'>
                <span className='loading__label'>{label}</span>
                {description ? (
                    <span className='loading__description'>{description}</span>
                ) : null}
            </span>
        </div>
    );
}

export { Loading };
export type { LoadingSize };
