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
  TextField,
} from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { CreateCsvOptions } from "../models/CreateCsvOptions.ts";
import {useState} from "react";
import {IRow} from "../models/Row.ts";

interface IFormInput {
  companies: string;
  sites: string;
  positions: string;
}

const MAX_CHAR_COUNT = 25;

const CreateCsvForm = () => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      companies: "Мосстрой",
      sites: "sbis.ru",
      positions: "директор\nруководитель\nначальник\nглава",
    },
  });

  const [csvDownloadLink, setCsvDownloadLink] = useState("");
  const [rows, setRows] = useState<IRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const logMessage = (message: string) => {
    setLogMessages((prev) => [message, ...prev]);
  };


  const onSubmitWs: SubmitHandler<IFormInput> = async (payload_data) => {
    const payload: CreateCsvOptions = {
      companies: payload_data.companies.split("\n"),
      sites: payload_data.sites.split("\n"),
      positions: payload_data.positions.split("\n"),
      access_token: import.meta.env.VITE_ACCESS_TOKEN,
    };

    const csvWs = new WebSocket(`${import.meta.env.VITE_API_BASE_URL_WS}/csv/progress`);

    setLoading(true);

    logMessage("Подключение к серверу...");

    csvWs.onopen = () => {
      logMessage("Отправка данных...");
      csvWs.send(JSON.stringify(payload));
    };

    csvWs.onmessage = (event) => {
      let row: IRow
      try {
        row = JSON.parse(event.data);
      } catch (error) {
        logMessage(`Ошибка при обработке данных: ${error}`);
        return
      }

      setCsvDownloadLink(row.download_link);
      setRows((prev) => [row, ...prev]);
      logMessage("Данные успешно загружены.");
    };

    csvWs.onmessage = (event) => {
      try {
        logMessage(event.data);
      } catch (error) {
        logMessage("Ошибка при обработке логов");
      }
    };

    csvWs.onerror = (event) => {
      console.error(event);
      logMessage(`Ошибка соединения с сервером.`);
    };

    csvWs.onclose = () => {
      setLoading(false);
      logMessage("Соединение закрыто.");
    };
  };


  const truncateString = (str: string, num: number): string =>
    str.slice(0, num - 3) + "...";

  return (
    <Stack spacing={3}>
      <form onSubmit={handleSubmit(onSubmitWs)}>
        <Stack spacing={2}>
          <Controller
            name="companies"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                id="outlined-textarea"
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
            render={({ field }) => (
              <TextField
                {...field}
                id="outlined-textarea"
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
            render={({ field }) => (
              <TextField
                {...field}
                id="outlined-textarea"
                label="Должности"
                placeholder="Директор"
                multiline
                rows={4}
              />
            )}
          />
            <LoadingButton loading={loading} variant="contained" type="submit">Отправить</LoadingButton>
        </Stack>
      </form>
      <TextField
        label="Логи"
        multiline
        rows={5}
        value={logMessages.join("\n")}
        InputProps={{
          readOnly: true,
        }}
        fullWidth
        variant="outlined"
        sx={{ mt: 3 }}
      />
      {csvDownloadLink !== "" && !loading ? (
        <Link href={csvDownloadLink}>Скачать CSV</Link>
      ) : (
        <Box>Здесь будет ссылка для скачивания...</Box>
      )}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
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
            {rows.map((row) => (
              <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">{truncateString(row.name, MAX_CHAR_COUNT)}</TableCell>
                <TableCell>{truncateString(row.position, MAX_CHAR_COUNT)}</TableCell>
                <TableCell>{truncateString(row.searched_company, MAX_CHAR_COUNT)}</TableCell>
                <TableCell>{truncateString(row.inferenced_company, MAX_CHAR_COUNT)}</TableCell>
                <TableCell><Link href={truncateString(row.original_url, MAX_CHAR_COUNT)}>
                  {truncateString(row.short_original_url, MAX_CHAR_COUNT)}</Link></TableCell>
                <TableCell>{truncateString(row.source, MAX_CHAR_COUNT)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default CreateCsvForm;