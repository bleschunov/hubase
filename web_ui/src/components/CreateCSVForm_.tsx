import {
    Box,
    Button,
    Link,
    MenuItem,
    Select,
    Stack,
    SelectChangeEvent,
} from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import { useState } from 'react';
import { useForm, FormProvider, SubmitHandler, UseFormReturn } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import NERForm from './NERForm';
import GPTForm from './GPTForm';
import { INERForm, IGPTForm, IRowWithId, Strategy, CsvResponse, IRow } from '../models/CsvResponse';
import DataGridTable from "./table/DataGridTable.tsx";
import SimpleTable from "./table/SimpleTable.tsx";
import LogViewer from './LogViewer';
import SearchQueryTester from './SearchQueryTester';

type ViewType = "simple" | "dataGrid";

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
    const [rows, setRows] = useState<IRowWithId[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const [compiledSearchQueries, setCompiledSearchQueries] = useState<string[]>([]);
    const [viewType, setViewType] = useState<"simple" | "dataGrid">("dataGrid");
    const [searchQueryTemplate, setSearchQueryTemplate] = useState<string>("");

    const handleStrategyChange = (event: SelectChangeEvent<Strategy>) => {
        setStrategy(event.target.value as Strategy);
    };

    const logMessage = (message: string) => {
        setLogMessages((prev) => [message, ...prev]);
    };

    const onTestSearchQuery: SubmitHandler<{ search_query_template: string }> = async (data) => {
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
            let row: CsvResponse;
            try {
                row = JSON.parse(event.data);
            } catch (error) {
                logMessage(`Ошибка при обработке данных: ${error}`);
                return;
            }

            if (row.type === "csv_row") {
                const rowData = row.data as IRow;
                const csv_row_with_id: IRowWithId = { id: uuidv4(), ...rowData };

                setCsvDownloadLink(rowData.download_link);
                setRows((prev) => [...prev, csv_row_with_id]);
            } else if (row.type === "log") {
                logMessage(row.data as string);
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

    const clearResults = () => {
        setRows([]);
        setCsvDownloadLink("");
    };

    let form = <NERForm />;
    let methods: UseFormReturn<INERForm | IGPTForm>;

    switch (strategy) {
        case "ner":
            form = <NERForm />;
            methods = nerOptionsForm as UseFormReturn<INERForm | IGPTForm>;
            break;
        case "gpt":
            form = <GPTForm />;
            methods = gptOptionsForm as UseFormReturn<INERForm | IGPTForm>;
            break;
        default:
            form = <NERForm />;
            methods = nerOptionsForm as UseFormReturn<INERForm | IGPTForm>;
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
                    <SearchQueryTester
                        onTestSearchQuery={onTestSearchQuery}
                        compiledSearchQueries={compiledSearchQueries}
                        loading={loading}
                        setSearchQueryTemplate={setSearchQueryTemplate}
                        searchQueryTemplate={searchQueryTemplate}
                    />
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
            <LogViewer logMessages={logMessages} />
            {csvDownloadLink !== "" && !loading ? (
                <Link href={csvDownloadLink}>Скачать CSV</Link>
            ) : (
                <Box>Здесь будет ссылка для скачивания...</Box>
            )}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="end">
                <Box flexGrow="1" />
                <Select
                    value={viewType}
                    onChange={(event: SelectChangeEvent) => setViewType(event.target.value as ViewType)}
                    variant="outlined"
                    displayEmpty
                >
                    <MenuItem value="simple">Простое</MenuItem>
                    <MenuItem value="dataGrid">Для профи 😎</MenuItem>
                </Select>
                <Button
                    variant="contained"
                    disabled={!rows.length || loading}
                    onClick={clearResults}
                >
                    Сбросить таблицу и ссылку
                </Button>
            </Stack>
            {viewType === "dataGrid" ? <DataGridTable rows={rows} /> : <SimpleTable rows={rows} />}
        </FormProvider>
    );
};

export default CreateCSVForm;
