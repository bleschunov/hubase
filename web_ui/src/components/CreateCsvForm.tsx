import {
  Box,
  Link,
  Paper,
  Snackbar,
  Stack,
  Table, TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import {Controller, SubmitHandler, useForm} from "react-hook-form";
import {CreateCsvOptions, CreateCsvResponseData} from "../models/CreateCsvOptions.ts";
import {useEffect, useState} from "react";


interface IFormInput {
  companies: string;
  sites: string;
  positions: string;
}

interface IRow {
  name: string;
  position: string;
  searched_company: string;
  inferenced_company: string;
  original_url: string;
  source: string;
  download_link: string;
}

const CreateCsvForm = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting}
  } = useForm({
    defaultValues: {
      companies: "Мосстрой",
      sites: "sbis.ru",
      positions: "директор\nруководитель\nначальник\nглава"
    }
  })

  const [csvDownloadLink, setCsvDownloadLink] = useState("")
  const [csvName, setCsvName] = useState("")

  const [rows, setRows] = useState<IRow[]>([])

  const [sbOpen, setSbOpen] = useState(false)
  const [sbMessage, setSbMessage] = useState("")

  const onSbClose = () => setSbOpen(false)

  const onSubmit: SubmitHandler<IFormInput> = async payload_data => {
    const payload: CreateCsvOptions = {
      companies: payload_data.companies.split("\n"),
      sites: payload_data.sites.split("\n"),
      positions: payload_data.positions.split("\n")
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

  const onSubmitWs: SubmitHandler<IFormInput> = async payload_data => {
    const payload: CreateCsvOptions = {
      companies: payload_data.companies.split("\n"),
      sites: payload_data.sites.split("\n"),
      positions: payload_data.positions.split("\n")
    }
    const ws = new WebSocket(`${import.meta.env.VITE_API_BASE_URL_WS}/csv/progress`)

    ws.onopen = event => {
      ws.send(JSON.stringify(payload))
    }

    ws.onmessage = event => {
      const row = JSON.parse(event.data)
      setRows(prev => [...prev, row])
    }

    // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/csv`, {
    //   method: "POST",
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(payload)
    // })
    //
    // if (response.status == 403) {
    //   setCsvDownloadLink("")
    //   setCsvName("")
    //   setSbMessage(await response.text())
    //   setSbOpen(true)
    //   return
    // }
    //
    // const response_data: CreateCsvResponseData = await response.json()
    // setCsvDownloadLink(response_data.download_link)
    //
    // const split = response_data.download_link.split("/")
    // const csvName = split[split.length-1]
    // setCsvName(csvName)
  };

  return (
    <Stack direction="row" spacing={3}>
      <form onSubmit={handleSubmit(onSubmitWs)}>
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
          <Controller
            name="positions"
            control={control}
            render={({ field }) =>
              <TextField
                {...field}
                id="outlined-textarea"
                label="Должности"
                placeholder="Директор"
                multiline
                rows={4}
              />
            }
          />
          <LoadingButton loading={isSubmitting} variant="contained" type="submit">Отправить</LoadingButton>
        </Stack>
      </form>
      {csvDownloadLink != "" && <Link href={csvDownloadLink}>Скачать CSV: {csvName}</Link>}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell>name</TableCell>
              <TableCell>position</TableCell>
              <TableCell>searched_company</TableCell>
              <TableCell>inferenced_company</TableCell>
              <TableCell>original_url</TableCell>
              <TableCell>source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.name}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell>{row.position}</TableCell>
                <TableCell>{row.searched_company}</TableCell>
                <TableCell>{row.inferenced_company}</TableCell>
                <TableCell>{row.original_url}</TableCell>
                <TableCell>{row.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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