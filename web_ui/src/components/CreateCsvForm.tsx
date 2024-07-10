import {Link, Snackbar, Stack, TextField} from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import {Controller, SubmitHandler, useForm} from "react-hook-form";
import {CreateCsvOptions, CreateCsvResponseData} from "../models/CreateCsvOptions.ts";
import {useState} from "react";


interface IFormInput {
  companies: string;
  sites: string;
}

const CreateCsvForm = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting}
  } = useForm({
    defaultValues: {
      companies: "Север Минералс",
      sites: "cfo-russia.ru"
    }
  });

  const [csvDownloadLink, setCsvDownloadLink] = useState("")
  const [csvName, setCsvName] = useState("")

  const [sbOpen, setSbOpen] = useState(false)
  const [sbMessage, setSbMessage] = useState("")

  const onSbClose = () => setSbOpen(false)

  const onSubmit: SubmitHandler<IFormInput> = async payload_data => {
    const payload: CreateCsvOptions = {
      companies: payload_data.companies.split("\n"),
      sites: payload_data.sites.split("\n")
    }
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/csv`, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (response.status == 403) {
      setCsvDownloadLink("")
      setCsvName("")
      setSbMessage(await response.text())
      setSbOpen(true)
      return
    }


    const response_data: CreateCsvResponseData = await response.json()
    setCsvDownloadLink(response_data.download_link)

    const split = response_data.download_link.split("/")
    const csvName = split[split.length-1]
    setCsvName(csvName)
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
          <LoadingButton loading={isSubmitting} variant="contained" type="submit">Отправить</LoadingButton>
        </Stack>
      </form>
      {csvDownloadLink != "" && <Link href={csvDownloadLink}>Скачать CSV: {csvName}</Link>}
      <Snackbar
        open={sbOpen}
        autoHideDuration={4000}
        onClose={onSbClose}
        message={sbMessage}
      />
    </Stack>
  )
}

export default CreateCsvForm