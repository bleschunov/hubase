import React from 'react';
import { TextField } from '@mui/material';

interface LogViewerProps {
    logMessages: string[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logMessages }) => {
    return (
        <TextField
            label="Логи"
            multiline
            rows={10}
            value={logMessages.join("\n")}
            InputProps={{
                readOnly: true,
            }}
            fullWidth
            variant="outlined"
            sx={{ mt: 3 }}
        />
    );
};

export default LogViewer;
