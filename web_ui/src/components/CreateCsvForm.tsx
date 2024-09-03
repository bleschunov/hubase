import {
    Box,
    Button,
    Divider,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
} from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import {Controller, SubmitHandler, useForm} from "react-hook-form";
import {CreateCsvOptions} from "../models/CreateCsvOptions.ts";
import {useState} from "react";
import {CsvResponse, IRow} from "../models/CsvResponse.ts";
import PromptForm from "./PromptForm.tsx";

interface IFormInput {
  search_query_template: string;
  companies: string;
  sites: string;
  positions: string;
  max_lead_count: number;
  openai_api_key: string;
  openai_api_base: string;
}

interface SearchQueryResponse {
  type: "error" | "success";
  data: string | string[];
}

const MAX_CHAR_COUNT = 25;

const CreateCsvForm = () => {
  const {
    control,
    handleSubmit,
    formState: {errors},
    setError,
  } = useForm<IFormInput>({
    defaultValues: {
      search_query_template: "{company} AND {positions} AND {site}",
      companies: "Мосстрой",
      sites: "sbis.ru",
      positions: "директор\nруководитель\nначальник\nглава",
      max_lead_count: 2,
      openai_api_key: localStorage.getItem("openai_api_key") || "",
      openai_api_base: localStorage.getItem("openai_api_base") || "",
    },
  });

  const [csvDownloadLink, setCsvDownloadLink] = useState("");
  const [rows, setRows] = useState<IRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [compiledSearchQueries, setCompiledSearchQueries] = useState<string[]>([])
  const [companyPromptContext, setCompanyPromptContext] = useState<string>("")
  const [positionPromptContext, setPositionPromptContext] = useState<string>("")

  const logMessage = (message: string) => {
    setLogMessages((prev) => [message, ...prev]);
  };

  const onTestSearchQuery: SubmitHandler<IFormInput> = async (payload_data): boolean => {
    setLoading(true)
    const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search_query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify(payload_data.search_query_template)
    })

    const resp_data = await resp.json() as SearchQueryResponse

    if (resp_data.type === "error") {
      const error_message = resp_data.data as string
      setCompiledSearchQueries([])
      setError("search_query_template", {type: "validation_error", message: error_message})
      setLoading(false)
      return false
    } else if (resp_data.type === "success") {
      const compiled_queries = resp_data.data as string[]
      setCompiledSearchQueries(compiled_queries)
      setLoading(false)
      return true
    }
  }


  const onSubmitWs: SubmitHandler<IFormInput> = async (payload_data) => {
    const is_test_success = await onTestSearchQuery(payload_data)

    if (!is_test_success) {
      return
    }

    localStorage.setItem("openai_api_key", payload_data.openai_api_key)
    localStorage.setItem("openai_api_base", payload_data.openai_api_base)

    const payload: CreateCsvOptions = {
      companies: payload_data.companies.split("\n"),
      sites: payload_data.sites.split("\n"),
      positions: payload_data.positions.split("\n"),
      search_query_template: payload_data.search_query_template,
      access_token: import.meta.env.VITE_ACCESS_TOKEN,
      company_prompt: companyPromptContext,
      position_prompt: positionPromptContext,
      max_lead_count: payload_data.max_lead_count,
      openai_api_key: payload_data.openai_api_key,
      openai_api_base: payload_data.openai_api_base,
    };

    const csvWs = new WebSocket(`${import.meta.env.VITE_API_BASE_URL_WS}/csv/progress`);

    setLoading(true);

    logMessage("Подключение к серверу...");

    csvWs.onopen = () => {
      logMessage("Отправка данных...");
      csvWs.send(JSON.stringify(payload));
    };

    csvWs.onmessage = (event) => {
      let row: CsvResponse
      try {
        row = JSON.parse(event.data);
      } catch (error) {
        logMessage(`Ошибка при обработке данных: ${error}`);
        return
      }

      if (row.type === "csv_row") {
        const csv_row = row.data as IRow

        setCsvDownloadLink(csv_row.download_link);
        setRows((prev) => [csv_row, ...prev]);
      } else if (row.type === "log") {
        const log_entry = row.data as string
        logMessage(log_entry);
      }
    };

    csvWs.onerror = () => {
      logMessage("Ошибка соединения с сервером.");
    };

    csvWs.onclose = () => {
      setLoading(false);
      logMessage("Соединение закрыто.");
    };
  };


  const truncateString = (str: string, num: number): string => str.length > num ? str.slice(0, num - 3) + "..." : str;

  const clearResults = () => {
    setRows([])
    setCsvDownloadLink("")
  }

  return (
    <Stack spacing={3}>
      <PromptForm
        setCompanyPromptContext={setCompanyPromptContext}
        setPositionPromptContext={setPositionPromptContext}
      />
      <Divider/>
      <form>
        <Stack spacing={2}>
          <Controller
            name="openai_api_key"
            control={control}
            render={({field}) => (
              <TextField
                {...field}
                label="API ключ для openai"
                placeholder="sk-..."
              />
            )}
          />
          <Controller
            name="openai_api_base"
            control={control}
            render={({field}) => (
              <TextField
                {...field}
                label="Прокси для openai"
                placeholder="https://..."
              />
            )}
          />
          <Stack spacing={1} sx={{border: "solid #CCC", p: 1, borderRadius: "10px"}}>
            <Controller
              name="search_query_template"
              control={control}
              render={({field}) =>
                <TextField
                  {...field}
                  error={Object.entries(errors).length > 0}
                  helperText={Object.entries(errors).length > 0 && errors?.search_query_template.message}
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
            {compiledSearchQueries.map((query: string, index: number) => <Box key={index}>{query}</Box>)}
          </Stack>
          <Controller
            name="companies"
            control={control}
            render={({field}) => (
              <TextField
                {...field}
                label="Компании"
                placeholder="Север Минералс"
                multiline
                rows={4}
              />
            )}
          />
          <Controller
            name="sites"
            control={control}
            render={({field}) => (
              <TextField
                {...field}
                label="Сайты для поиска"
                placeholder="cfo-russia.ru"
                multiline
                rows={4}
              />
            )}
          />
          <Controller
            name="positions"
            control={control}
            render={({field}) => (
              <TextField
                {...field}
                label="Должности"
                placeholder="Директор"
                multiline
                rows={4}
              />
            )}
          />
          <Box>
            <Controller
              name="max_lead_count"
              control={control}
              render={({field}) => (
                <TextField
                  {...field}
                  label="Сколько лидов ищём"
                  type="number"
                />
              )}
            />
          </Box>
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
      <TextField
        label="Логи"
        multiline
        rows={10}
        value={logMessages.join("\n")}
        InputProps={{
          readOnly: true,
        }}
        fullWidth
        variant="outlined"
        sx={{mt: 3}}
      />
      <Divider/>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        {csvDownloadLink !== "" && !loading ? (
          <Link href={csvDownloadLink}>Скачать CSV</Link>
        ) : (
          <Box>Здесь будет ссылка для скачивания...</Box>
        )}
        <Button
          variant="contained"
          disabled={!rows.length || loading}
          onClick={clearResults}>
            Сбросить таблицу и ссылку
        </Button>
      </Stack>
      <TableContainer component={Paper}>
        <Table sx={{minWidth: 650}} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Должность</TableCell>
              <TableCell>Искомая компания</TableCell>
              <TableCell>Реальная компания</TableCell>
              <TableCell>Ссылка на источник</TableCell>
              <TableCell>Пруф из источника</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}
                        sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                <TableCell component="th"
                           scope="row">{truncateString(row.name, MAX_CHAR_COUNT)}</TableCell>
                <TableCell>{truncateString(row.position, MAX_CHAR_COUNT)}</TableCell>
                <TableCell>{truncateString(row.searched_company, MAX_CHAR_COUNT)}</TableCell>
                <TableCell>{truncateString(row.inferenced_company, MAX_CHAR_COUNT)}</TableCell>
                <TableCell><Link href={row.original_url} target="_blank">
                  {row.original_url}</Link></TableCell>
                <TableCell>{row.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default CreateCsvForm;