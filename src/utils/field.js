export const checkHasMissingRequiredFields = (fields) => {
  if (!Array.isArray(fields) || fields.length === 0) return true;
  const validFields = fields.filter((field) => !!field.column);
  if (validFields.length < fields.length) return true;
  return validFields.some((filed) => {
    return filed.column.type !== filed.required_type;
  });
};
