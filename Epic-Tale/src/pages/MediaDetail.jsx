import { useParams } from 'react-router-dom';

export default function MediaDetail() {
    const { id } = useParams();
    
    return (
        <div className="detail-container">
            <div className="detail-top">
                <div className="cover-photo-container">
                    <div className="placeholder-cover">
                        <h2>?</h2>
                        <div>Cover Pending</div>
                    </div>
                </div>
                <div className="detail-info">
                    <h1>Media Detail View</h1>
                    <p className="series">For Item ID: {id}</p>
                    <p>This page is currently under construction. Please check back later!</p>
                </div>
            </div>
        </div>
    );
}
