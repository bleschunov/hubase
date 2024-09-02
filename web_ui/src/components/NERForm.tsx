import React from 'react';
import {useFormContext, Controller} from 'react-hook-form';
import {Stack, TextField} from '@mui/material';
import PromptForm from './PromptForm';

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

const NERForm: React.FC<NERFormProps> = ({setCompanyPromptContext, setPositionPromptContext}) => {
    const {control} = useFormContext<INERForm>();

    return (
        <Stack spacing={2}>
            <PromptForm
                setCompanyPromptContext={setCompanyPromptContext}
                setPositionPromptContext={setPositionPromptContext}
            />
            <Controller
                name="companies"
                control={control}
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Компании"
                        placeholder="Введите названия компаний"
                        multiline
                        rows={4}
                    />
                )}
            />
            <Controller
                name="sites"
                control={control}
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Сайты"
                        placeholder="Введите URL сайтов"
                        multiline
                        rows={4}
                    />
                )}
            />
            <Controller
                name="positions"
                control={control}
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Должности"
                        placeholder="Введите должности"
                        multiline
                        rows={4}
                    />
                )}
            />
            <Controller
                name="search_query_template"
                control={control}
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Шаблон поискового запроса"
                        placeholder="Введите шаблон"
                    />
                )}
            />
            <Controller
                name="max_lead_count"
                control={control}
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Максимальное количество лидов"
                        type="number"
                    />
                )}
            />
        </Stack>
    );
};

export default NERForm;
