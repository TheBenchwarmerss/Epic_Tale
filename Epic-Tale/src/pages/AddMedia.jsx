import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

export default function AddMedia() {
    const [form, setForm] = useState({ name: '', description: '', author: '', type_id: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [types, setTypes] = useState([])

    useEffect(() => {
        async function getTypes() {
            const { data, error } = await supabase
                .from('types')
                .select('id, type')
                .order('type', { ascending: true })
            if (!error) setTypes(data)
        }
        getTypes()
    }, [])

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorMessage('')
        setSuccessMessage('')

        let authorId = null
        const { data: existingCreators, error: lookupError } = await supabase
            .from('Creators')
            .select('id')
            .ilike('creator', form.author)
            .limit(1)

        if (lookupError) {
            setErrorMessage(lookupError.message)
            setIsSubmitting(false)
            return
        }

        if (existingCreators && existingCreators.length > 0) {
            authorId = existingCreators[0].id
        } else {
            const { data: newCreator, error: insertCreatorError } = await supabase
                .from('Creators')
                .insert([{ creator: form.author }])
                .select('id')
                .single()

            if (insertCreatorError) {
                setErrorMessage(insertCreatorError.message)
                setIsSubmitting(false)
                return
            }
            authorId = newCreator.id
        }

        const { error: mediaError } = await supabase
            .from('media')
            .insert([{ name: form.name, description: form.description, creator_id: authorId, type_id: form.type_id }])

        if (mediaError) {
            setErrorMessage(mediaError.message)
        } else {
            setSuccessMessage('Media added successfully!')
            setForm({ name: '', description: '', author: '', type_id: '' })
        }
        setIsSubmitting(false)
    }

    return (
        <div className="detail-container">
            <form onSubmit={handleSubmit}>
                <div className="detail-top">
                    <div className="cover-photo-container">
                        <div className="placeholder-cover">
                            <h2>+</h2>
                            <div>Add Cover Photo</div>
                        </div>
                    </div>
                    <div className="detail-info">
                        <div className="input-group">
                            <input
                                name="name"
                                type="text"
                                className="input-text"
                                placeholder="Name..."
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <textarea
                                name="description"
                                className="input-textarea"
                                placeholder="Description..."
                                value={form.description}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                name="author"
                                type="text"
                                className="input-text"
                                placeholder="Author / Creator..."
                                value={form.author}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <select
                                name="type_id"
                                className="input-text"
                                style={{ background: 'var(--bg-card)' }}
                                value={form.type_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a type...</option>
                                {types.map((t) => (
                                    <option key={t.id} value={t.id}>{t.type}</option>
                                ))}
                            </select>
                        </div>

                        {errorMessage && <p style={{ color: '#b00020' }}>{errorMessage}</p>}
                        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="btn-filter"
                            style={{ marginTop: '1rem', width: '100%', border: '2px solid var(--text-dark)' }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Create Media'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
