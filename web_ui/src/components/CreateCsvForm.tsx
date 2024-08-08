import {
  Box,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
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
import {IRow} from "../models/Row.ts";


interface IFormInput {
  search_query: string;
  companies: string;
  sites: string;
  positions: string;
}

// interface SearchQueryError {
//   type: "err";
//   message: string;
// }
//
// interface SearchQuerySuccess {
//   type: "success";
//   data: { "compiled_search_queries": string[] }
// }


const CreateCsvForm = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<IFormInput>({
    defaultValues: {
      search_query: "{company} AND {positions} AND {site}",
      companies: "Мосстрой",
      sites: "sbis.ru",
      positions: "директор\nруководитель\nначальник\nглава"
    }
  })

  const [csvDownloadLink, setCsvDownloadLink] = useState("")
  const [rows, setRows] = useState<IRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [compiledSearchQueries, setCompiledSearchQueries] = useState<string[]>([])

  const onTestSearchQuery: SubmitHandler<IFormInput> = async payload_data => {
    setLoading(true)
    const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search_query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify(payload_data.search_query)
    })

    const resp_data = await resp.json()

    if (resp_data.type === "error") {
      setError("search_query", resp_data.message)
    }
    else if (resp_data.type === "success") {
      setCompiledSearchQueries(resp_data.compiled_search_queries)
    }

    setLoading(false)
  }

  const onSubmitWs: SubmitHandler<IFormInput> = async payload_data => {
    const payload: CreateCsvOptions = {
      companies: payload_data.companies.split("\n"),
      sites: payload_data.sites.split("\n"),
      positions: payload_data.positions.split("\n"),
      access_token: import.meta.env.VITE_ACCESS_TOKEN,
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
      <form>
        <Stack spacing={2}>
          <Controller
            name="search_query"
            control={control}
            render={({ field }) =>
              <TextField
                {...field}
                error={Object.entries(errors).length > 0}
                helperText={Object.entries(errors).length > 0 && errors?.search_query.message}
                id="outlined-textarea"
                label="Поисковой запрос"
                placeholder="{company} AND {positions} AND {site}"
              />
            }
          />
          <Box>
            <LoadingButton
              loading={loading}
              variant="outlined"
              onClick={handleSubmit(onTestSearchQuery)}
            >
              Протестировать
            </LoadingButton>
          </Box>
          {compiledSearchQueries.map((query: string) => <Box>{query}</Box>)}
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
          <Box>
            <LoadingButton
              onClick={handleSubmit(onSubmitWs)}
              loading={loading}
              variant="contained"
              type="submit"
            >
              Отправить
            </LoadingButton>
          </Box>
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