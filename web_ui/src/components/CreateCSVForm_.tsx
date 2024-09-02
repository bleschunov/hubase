// import {useForm} from "react-hook-form";
// import {useState} from "react";
// import {Strategy} from "../models/CreateCsvOptions.ts";
//
//
// const CreateCSVForm = () => {
//   const gptOptionsForm = useForm<IGPTForm>({
//     // defaultValues: {...}
//   })
//   const nerOptionsForm = useForm<INERForm>({
//     // defaultValues: {...}
//   })
//
//   const [strategy, setStrategy] = useState<Strategy>("ner")
//
//   let form= <NERForm />
//
//   switch (strategy) {
//     case "ner":
//       form = <NERForm />
//       break
//     case "gpt":
//       form = <GPTForm />
//       break
//   }
// }
//
//   return (
//     // https://mui.com/material-ui/react-select/
//     // <Select>...</Select>
//
//     // https://www.react-hook-form.com/advanced-usage/#FormProviderPerformance
//     // https://habr.com/ru/articles/746806/
//     <FormProvider {...methods}>
//       { form }
//     </FormProvider>
//   )
// }



import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useState } from 'react';
import NERForm from './NERForm';
import GPTForm from './GPTForm';
import { INERForm, IGPTForm } from '../models/types';


const CreateCSVForm = () => {
    const gptOptionsForm = useForm<IGPTForm>({
        defaultValues: {
            companies: "",
            sites: "",
            search_query_template: "{company} AND {sites}",
            max_lead_count: 10
        },
    });
    const nerOptionsForm = useForm<INERForm>({
        defaultValues: {
            companies: "",
            sites: "",
            positions: "",
            search_query_template: "{company} AND {positions} AND {site}",
            max_lead_count: 10
        },
    });

    const [strategy, setStrategy] = useState<Strategy>("ner");

    const handleStrategyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setStrategy(event.target.value as Strategy);
    };

    const methods = strategy === "ner" ? nerOptionsForm : gptOptionsForm;

    let form = <NERForm />;
      switch (strategy) {
        case "ner":
          form = <NERForm />
          break
        case "gpt":
          form = <GPTForm />
          break
          default:
              form = <NERForm />;
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
