type LoadingSize = 'small' | 'medium' | 'large';

type LoadingProps = {
    label?: string;
    size?: LoadingSize;
    centred?: boolean;
};

function Loading({
    label = 'Loading...',
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
            <span className='loading__label'>{label}</span>
        </div>
    );
}

export { Loading };
export type { LoadingSize };