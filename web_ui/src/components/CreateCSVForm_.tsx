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
import React, { useState } from 'react';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import NERForm from './NERForm';
import GPTForm from './GPTForm';
import { INERForm, IGPTForm, IRow, Strategy } from '../models/types';

const MAX_CHAR_COUNT = 25;

const CreateCSVForm = () => {
    const gptOptionsForm = useForm<IGPTForm>({
        defaultValues: {
            search_query_template: "{company} AND {sites}",
            companies: "Мосстрой",
            sites: "sbis.ru",
            max_lead_count: 2,
            openai_api_key: "",
            openai_api_base: ""
        },
    });
    const nerOptionsForm = useForm<INERForm>({
        defaultValues: {
            search_query_template: "{company} AND {positions} AND {site}",
            companies: "Мосстрой",
            sites: "sbis.ru",
            positions: "директор\nруководитель\nначальник\nглава",
            max_lead_count: 2,
            companyPrompt: "",
            positionPrompt: ""
        },
    });

    const [strategy, setStrategy] = useState<Strategy>("ner");
    const [csvDownloadLink, setCsvDownloadLink] = useState<string>("");
    const [rows, setRows] = useState<IRow[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const [compiledSearchQueries, setCompiledSearchQueries] = useState<string[]>([]);

    const handleStrategyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setStrategy(event.target.value as Strategy);
    };

    const logMessage = (message: string) => {
        setLogMessages((prev) => [message, ...prev]);
    };

    const onTestSearchQuery: SubmitHandler<INERForm | IGPTForm> = async (data) => {
        setLoading(true);
        const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search_query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            body: JSON.stringify(data.search_query_template)
        });

        const resp_data = await resp.json();

        if (resp_data.type === "error") {
            setCompiledSearchQueries([]);
            logMessage(`Ошибка: ${resp_data.data}`);
            setLoading(false);
        } else if (resp_data.type === "success") {
            const compiled_queries = resp_data.data;
            setCompiledSearchQueries(compiled_queries);
            setLoading(false);
        }
    };

    const handleFormSubmit: SubmitHandler<INERForm | IGPTForm> = async (data) => {
        const is_test_success = await onTestSearchQuery(data);

        if (!is_test_success) {
            return;
        }

        setLoading(true);

        const csvWs = new WebSocket(`${import.meta.env.VITE_API_BASE_URL_WS}/csv/progress`);

        logMessage("Подключение к серверу...");

        csvWs.onopen = () => {
            logMessage("Отправка данных...");
            csvWs.send(JSON.stringify(data));
        };

        csvWs.onmessage = (event) => {
            let row: IRow;
            try {
                row = JSON.parse(event.data);
            } catch (error) {
                logMessage(`Ошибка при обработке данных: ${error}`);
                return;
            }

            if (row.type === "csv_row") {
                const csv_row = row.data as IRow;

                setCsvDownloadLink(csv_row.download_link);
                setRows((prev) => [csv_row, ...prev]);
            } else if (row.type === "log") {
                const log_entry = row.data as string;
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

    let form = <NERForm />;
    let methods;

    switch (strategy) {
        case "ner":
            form = <NERForm />;
            methods = nerOptionsForm;
            break;
        case "gpt":
            form = <GPTForm />;
            methods = gptOptionsForm;
            break;
        default:
            form = <NERForm />;
            methods = nerOptionsForm;
            break;
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleFormSubmit)}>
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
                    <Box>
                        <LoadingButton
                            loading={loading}
                            variant="outlined"
                            onClick={methods.handleSubmit(onTestSearchQuery)}
                        >
                            Протестировать
                        </LoadingButton>
                    </Box>
                    {compiledSearchQueries.map((query: string, index: number) => (
                        <Box key={index}>{query}</Box>
                    ))}
                    <LoadingButton
                        type="submit"
                        loading={loading}
                        variant="contained"
                        color="primary"
                    >
                        Отправить
                    </LoadingButton>
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
                        {rows.map((row, index) => (
                            <TableRow key={index}
                                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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
        </FormProvider>
    );
};


export default CreateCSVForm;