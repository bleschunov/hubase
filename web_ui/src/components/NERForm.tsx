import React from 'react';
import {useFormContext, Controller} from 'react-hook-form';
import {Stack, TextField} from '@mui/material';
import LeadParamsForm from './LeadParamsForm';

interface INERForm {
    strategy: "ner";
    companies: string;
    sites: string;
    positions: string;
    search_query_template: string;
    max_lead_count: number;
    companyPrompt: string;
    positionPrompt: string;
}

const NERForm: React.FC<INERForm> = () => {
    const {control} = useFormContext<INERForm>();

    return (
        <Stack spacing={2}>
            <Controller
                name="companyPrompt"
                control={control}
                defaultValue=""
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Компании"
                        variant="outlined"
                    />
                )}
            />
            <Controller
                name="positionPrompt"
                control={control}
                defaultValue=""
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Должности"
                        variant="outlined"
                    />
                )}
            />
            <LeadParamsForm/>
        </Stack>
    );
};

export default NERForm;
