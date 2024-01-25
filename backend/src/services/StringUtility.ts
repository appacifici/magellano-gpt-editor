class StringUtility {
    static sanitizeString(str:string) {
        // Elimina i caratteri speciali eccetto lo spazio
        let sanitizedString = str.replace(/[^a-zA-Z0-9 ]/g, "");
    
        // Sostituisce gli spazi con il simbolo -
        sanitizedString = sanitizedString.replace(/\s+/g, "-");
    
        return sanitizedString;
    }
}

export default StringUtility;