export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateCSV = (data: any[]): CSVValidationResult => {
  const errors: string[] = [];
  
  try {
    if (!data || data.length === 0) {
      errors.push('CSV data appears empty.');
      return { isValid: false, errors };
    }
    
    const headers = Object.keys(data[0]).map(h => h.trim().toLowerCase());
    const requiredHeaders = ['date', 'occupancy_rate', 'property_id'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`);
      return { isValid: false, errors };
    }

    // Check valid data formats
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row.date || isNaN(new Date(row.date).getTime())) {
        errors.push(`Invalid date format in row ${i + 1}`);
      }
      if (!row.occupancy_rate || isNaN(Number(row.occupancy_rate))) {
        errors.push(`Invalid occupancy_rate format in row ${i + 1}`);
      }
      if (!row.property_id || !row.property_id.trim()) {
        errors.push(`Missing property_id in row ${i + 1}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  } catch (err: any) {
    errors.push('Failed to parse CSV file for validation.');
    return { isValid: false, errors };
  }
};
