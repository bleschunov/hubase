import {useForm} from "react-hook-form";
import {useState} from "react";
import {Strategy} from "../models/CreateCsvOptions.ts";


const CreateCSVForm = () => {
  const gptOptionsForm = useForm<IGPTForm>({
    // defaultValues: {...}
  })
  const nerOptionsForm = useForm<INERForm>({
    // defaultValues: {...}
  })

  const [strategy, setStrategy] = useState<Strategy>("ner")

  let form= <NERForm />

  switch (strategy) {
    case "ner":
      form = <NERForm />
      break
    case "gpt":
      form = <GPTForm />
      break
  }
}

  return (
    // https://mui.com/material-ui/react-select/
    // <Select>...</Select>

    // https://www.react-hook-form.com/advanced-usage/#FormProviderPerformance
    // https://habr.com/ru/articles/746806/
    <FormProvider {...methods}>
      { form }
    </FormProvider>
  )
}