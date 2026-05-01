import { useState } from 'react'

export interface FormFields {
	title: string
	content: string
	category: string
}

export interface FormErrors {
	title?: string
	content?: string
	category?: string
}

const validate = (fields: FormFields): FormErrors => {
	const errors: FormErrors = {}

	if (fields.title.trim() && fields.title.trim().length < 2) {
		errors.title = 'Title must be at least 2 characters'
	}

	if (!fields.content.trim()) {
		errors.content = 'Content is required'
	}

	return errors
}

const useBaseKnowledgeForm = (
	initial: FormFields = { title: '', content: '', category: '' }
) => {
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})

	const setField = <K extends keyof FormFields>(key: K, value: string) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const runValidation = (): boolean => {
		const result = validate(fields)
		setErrors(result)
		return Object.keys(result).length === 0
	}

	const reset = (values?: FormFields) => {
		setFields(values ?? { title: '', content: '', category: '' })
		setErrors({})
	}

	return { fields, errors, setField, runValidation, reset }
}

export default useBaseKnowledgeForm
