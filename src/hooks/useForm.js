import { useState } from 'react';
import { validate } from '../utils/validators';

export function useForm(schema, initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = (onValid) => async () => {
    const { valid, errors: errs } = validate(schema, values);
    if (!valid) {
      setErrors(errs);
      return;
    }
    setErrors({});
    await onValid(values);
  };

  return { values, errors, setField, handleSubmit };
}