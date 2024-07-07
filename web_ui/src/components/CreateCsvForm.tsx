import {Button, Link, Stack, TextField} from "@mui/material";
import {Controller, SubmitHandler, useForm} from "react-hook-form";
import CreateCsvOptions from "../models/CreateCsvOptions.ts";
import {useState} from "react";


interface IFormInput {
  companies: string;
  sites: string;
}

const CreateCsvForm = () => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      companies: "",
      sites: ""
    }
  });

  const [csvDownloadLink, setCsvDownloadLink] = useState("")

  const onSubmit: SubmitHandler<IFormInput> = async data => {
    const payload: CreateCsvOptions = {
      companies: data.companies.split("\n"),
      sites: data.sites.split("\n")
    }
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/csv`, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    const downloadLink = await response.json()
    setCsvDownloadLink(downloadLink)
  };

  return (
    <Stack spacing={3}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            name="companies"
            control={control}
            render={({ field }) =>
              <TextField
                {...field}
                id="outlined-textarea"
                label="Компании"
                placeholder="Север Минералс"
                multiline
                rows={4}
              />
            }
          />
          <Controller
            name="sites"
            control={control}
            render={({ field }) =>
              <TextField
                {...field}
                id="outlined-textarea"
                label="Сайты для поиска"
                placeholder="cfo-russia.ru"
                multiline
                rows={4}
              />
            }
          />
          <Button variant="contained" type="submit">Отправить</Button>
        </Stack>
      </form>
      {csvDownloadLink != "" && <Link href={csvDownloadLink}>Ссылка для скачивания результата</Link>}
    </Stack>
  )
}

export default CreateCsvForm