import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Stack } from '@mui/material';
import PromptForm from './PromptForm';
import SearchEngineQueryForm from './SearchEngineQueryForm';
import LeadParamsForm from './LeadParamsForm';

interface NERFormProps {
    setCompanyPromptContext: (value: string) => void;
    setPositionPromptContext: (value: string) => void;
}

interface INERForm {
    strategy: "ner";
    companies: string;
    sites: string;
    positions: string;
    search_query_template: string;
    max_lead_count: number;
}

const NERForm: React.FC<NERFormProps> = ({ setCompanyPromptContext, setPositionPromptContext }) => {
    const { control } = useFormContext<INERForm>();

    return (
        <Stack spacing={2}>
            <PromptForm
                setCompanyPromptContext={setCompanyPromptContext}
                setPositionPromptContext={setPositionPromptContext}
            />
            <SearchEngineQueryForm control={control} />
            <LeadParamsForm control={control} />
        </Stack>
    );
};

export default NERForm;
