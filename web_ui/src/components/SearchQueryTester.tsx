import React from 'react';
import { Box, TextField } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';

interface SearchQueryTesterProps {
    onTestSearchQuery: (data: { search_query_template: string }) => void;
    compiledSearchQueries: string[];
    loading: boolean;
    setSearchQueryTemplate: React.Dispatch<React.SetStateAction<string>>;
    searchQueryTemplate: string;
}

const SearchQueryTester: React.FC<SearchQueryTesterProps> = ({
    onTestSearchQuery,
    compiledSearchQueries,
    loading,
    setSearchQueryTemplate,
    searchQueryTemplate
}) => {
    const methods = useForm<{ search_query_template: string }>({
        defaultValues: { search_query_template: searchQueryTemplate }
    });

    const handleTestSearchQuery: SubmitHandler<{ search_query_template: string }> = (data) => {
        onTestSearchQuery(data);
    };

    return (
        <FormProvider {...methods}>
            <Box>
                <TextField
                    label="Шаблон поискового запроса"
                    value={searchQueryTemplate}
                    onChange={(e) => setSearchQueryTemplate(e.target.value)}
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    sx={{ mb: 2 }}
                />
                <LoadingButton
                    loading={loading}
                    variant="outlined"
                    onClick={methods.handleSubmit(handleTestSearchQuery)}
                >
                    Протестировать
                </LoadingButton>
                <Box sx={{ mt: 2 }}>
                    {compiledSearchQueries.map((query: string, index: number) => (
                        <Box key={index}>{query}</Box>
                    ))}
                </Box>
            </Box>
        </FormProvider>
    );
};

export default SearchQueryTester;
