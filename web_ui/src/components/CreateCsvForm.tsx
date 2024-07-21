import {
  Box,
  Link,
  Paper,
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
import {CreateCsvOptions} from "../models/CreateCsvOptions.ts";
import {useState} from "react";


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
  short_original_url: string;
  source: string;
  download_link: string;
}

const CreateCsvForm = () => {
  const {
    control,
    handleSubmit,
  } = useForm({
    defaultValues: {
      companies: "Мосстрой",
      sites: "sbis.ru",
      positions: "директор\nруководитель\nначальник\nглава"
    }
  })

  const [csvDownloadLink, setCsvDownloadLink] = useState("")
  // const [csvName, setCsvName] = useState("")

  const [rows, setRows] = useState<IRow[]>([])

  // const [sbOpen, setSbOpen] = useState(false)
  // const [sbMessage, setSbMessage] = useState("")

  const [loading, setLoading] = useState<boolean>(false)

  // const onSbClose = () => setSbOpen(false)

  const onSubmitWs: SubmitHandler<IFormInput> = async payload_data => {
    const payload: CreateCsvOptions = {
      companies: payload_data.companies.split("\n"),
      sites: payload_data.sites.split("\n"),
      positions: payload_data.positions.split("\n")
    }
    const ws = new WebSocket(`${import.meta.env.VITE_API_BASE_URL_WS}/csv/progress`)
    setLoading(true)

    ws.onopen = () => {
      ws.send(JSON.stringify(payload))
    }

    ws.onmessage = event => {
      const row: IRow = JSON.parse(event.data)
      setCsvDownloadLink(row.download_link)
      setRows(prev => [row, ...prev])
    }

    ws.onclose = () => {
      setLoading(false)
    }
  };

  return (
    <Stack spacing={3}>
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
          <LoadingButton loading={loading} variant="contained" type="submit">Отправить</LoadingButton>
        </Stack>
      </form>
      {
        csvDownloadLink !== "" && !loading
          ? <Link href={csvDownloadLink}>Скачать CSV</Link>
          : <Box>Здесь будет ссылка для скачивания скачивания...</Box>
      }
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Должность</TableCell>
              <TableCell>Искомая компаняи</TableCell>
              <TableCell>Реальная компания</TableCell>
              <TableCell>Ссылка на источник</TableCell>
              <TableCell>Пруф из источника</TableCell>
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
                <TableCell><Link href={row.original_url}>{row.short_original_url}</Link></TableCell>
                <TableCell>{row.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/*<Snackbar*/}
      {/*  open={sbOpen}*/}
      {/*  autoHideDuration={4000}*/}
      {/*  onClose={onSbClose}*/}
      {/*  message={sbMessage}*/}
      {/*/>*/}
    </Stack>
  )
}

export default CreateCsvForm