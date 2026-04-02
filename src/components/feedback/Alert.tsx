import type { ReactNode } from 'react';

type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

type AlertProps = {
    title?: string;
    children: ReactNode;
    variant?: AlertVariant;
};

function Alert({
    title,
    children,
    variant = 'default'
}: AlertProps) {
    return (
        <div
            className={`alert alert--${variant}`}
            role={variant === 'error' ? 'alert' : 'status'}
        >
            {title ? <strong className='alert__title'>{title}</strong> : null}
            <div className='alert__content'>{children}</div>
        </div>
    );
}

export { Alert };
export type { AlertVariant };