import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function NotFoundPage() {
    useDocumentTitle('Page not found | Site Score UI');

    return (
        <section className='page'>
            <div className='card'>
                <h1>Page not found</h1>
                <p>The page you tried to open does not exist.</p>
                <p>
                    <Link to='/projects'>Go to projects</Link>
                </p>
            </div>
        </section>
    );
}

export { NotFoundPage };