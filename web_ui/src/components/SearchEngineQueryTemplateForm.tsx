import React from 'react';
import { Stack, TextField, Box } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

interface SearchEngineQueryTemplateFormProps {
    onTestSearchQuery: (data: { search_query_template: string }) => void;
    compiledSearchQueries: string[];
    loading: boolean;
    setSearchQueryTemplate: React.Dispatch<React.SetStateAction<string>>;
    searchQueryTemplate: string;
}

const SearchEngineQueryTemplateForm: React.FC<SearchEngineQueryTemplateFormProps> = ({
    onTestSearchQuery,
    compiledSearchQueries,
    loading,
    setSearchQueryTemplate,
    searchQueryTemplate
}) => {
    return (
        <Stack spacing={2}>
            <TextField
                label="Шаблон поискового запроса"
                value={searchQueryTemplate}
                onChange={(e) => setSearchQueryTemplate(e.target.value)}
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                placeholder="Введите шаблон поискового запроса"
            />

            <LoadingButton
                loading={loading}
                variant="outlined"
                onClick={() => onTestSearchQuery({ search_query_template: searchQueryTemplate })}
            >
                Протестировать
            </LoadingButton>

            <Box>
                {compiledSearchQueries.map((query: string, index: number) => (
                    <Box key={index}>{query}</Box>
                ))}
            </Box>
        </Stack>
    );
};

export default SearchEngineQueryTemplateForm;
