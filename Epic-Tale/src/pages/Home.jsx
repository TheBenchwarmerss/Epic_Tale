import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { Link } from 'react-router-dom';

export default function Home() {
    const [media, setMedia] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        async function getMedia() {
            setIsLoading(true);
            setErrorMessage('');
            const { data, error } = await supabase
                .from('media')
                .select('id, name, description, Creators(creator), types(type)')
                .order('id', { ascending: true });

            if (error) {
                setErrorMessage(error.message);
            } else {
                setMedia(data ?? []);
            }
            setIsLoading(false);
        }
        getMedia();
    }, []);

    return (
        <>
            <div className="list-header">
                <input type="text" className="search-bar" style={{ maxWidth: '400px' }} placeholder="search" />
                <button className="btn-filter">Filters</button>
            </div>

            <div className="list-container">
                {isLoading && <p>Loading media...</p>}
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                
                {!isLoading && !errorMessage && media.length === 0 && (
                    <p>No media found.</p>
                )}

                {media.map((item) => (
                    <Link to={`/detail/${item.id}`} key={item.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="list-item">
                            <div className="list-title">{item.name}</div>
                            <div className="list-desc">{item.description}</div>
                            <div className="list-meta">
                                <div>{item.types?.type}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{item.Creators?.creator}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    );
}
