import React from 'react';
import {useForm, FormProvider} from 'react-hook-form';
import {useState} from 'react';
import NERForm from './NERForm';
import GPTForm from './GPTForm';
import {INERForm, IGPTForm} from '../models/types';


const CreateCSVForm = () => {
    const gptOptionsForm = useForm<IGPTForm>({
        defaultValues: {
            search_query_template: "{company} AND {sites}",
            companies: "Мосстрой",
            sites: "sbis.ru",
            max_lead_count: 2
        },
    });
    const nerOptionsForm = useForm<INERForm>({
        defaultValues: {
            search_query_template: "{company} AND {positions} AND {site}",
            companies: "Мосстрой",
            sites: "sbis.ru",
            positions: "директор\nруководитель\nначальник\nглава",
            max_lead_count: 2
        },
    });

    const [strategy, setStrategy] = useState<Strategy>("ner");

    const handleStrategyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setStrategy(event.target.value as Strategy);
    };

    let form = <NERForm/>;
    let methods;

    switch (strategy) {
        case "ner":
            form = <NERForm/>;
            methods = nerOptionsForm;
            break;
        case "gpt":
            form = <GPTForm/>;
            methods = gptOptionsForm;
            break;
        default:
            form = <NERForm/>;
            methods = nerOptionsForm;
            break;
    }


    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(data => console.log(data))}>
                <Stack spacing={3}>
                    <Select
                        value={strategy}
                        onChange={handleStrategyChange}
                        variant="outlined"
                        displayEmpty
                    >
                        <MenuItem value="ner">NER</MenuItem>
                        <MenuItem value="gpt">GPT-4</MenuItem>
                    </Select>
                    {form}
                </Stack>
            </form>
        </FormProvider>
    );
};
