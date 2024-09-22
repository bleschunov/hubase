import {
    Box,
    Button,
    Divider,
    FormControl,
    InputLabel,
    Link,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack,
    TextField,
} from "@mui/material";
import {v4 as uuidv4} from 'uuid';
import LoadingButton from '@mui/lab/LoadingButton';
import {Controller, SubmitHandler, useForm} from "react-hook-form";
import {CreateCsvOptions} from "../models/CreateCsvOptions.ts";
import {useState} from "react";
import {CsvResponse, IRow, IRowWithId} from "../models/CsvResponse.ts";
import PromptForm from "./PromptForm.tsx";
import DataGridTable from "./table/DataGridTable.tsx";
import SimpleTable from "./table/SimpleTable.tsx";

interface IFormInput {
    search_query_template: string;
    companies: string;
    sites: string;
    positions: string;
    max_lead_count: number;
    max_sites_count: number;
    openai_api_key: string;
    openai_api_base: string;
    mode: Mode;
}

interface SearchQueryResponse {
    type: "error" | "success";
    data: string | string[];
}

type ViewType = "simple" | "dataGrid"
type Mode = "parser" | "researcher"

const CreateCsvForm = () => {
    const {
        control,
        handleSubmit,
        formState: {errors},
        setError,
        setValue,
    } = useForm<IFormInput>({
        defaultValues: {
            search_query_template: "{company} AND {positions} AND {site}",
            companies: "Мосстрой",
            sites: "sbis.ru",
            positions: "директор\nруководитель\nначальник\nглава",
            max_lead_count: 2,
            max_sites_count: 50,
            openai_api_key: localStorage.getItem("openai_api_key") || "",
            openai_api_base: localStorage.getItem("openai_api_base") || "",
            mode: "parser",
        },
    });

    const [csvDownloadLink, setCsvDownloadLink] = useState("");
    const [rows, setRows] = useState<IRowWithId[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const [compiledSearchQueries, setCompiledSearchQueries] = useState<string[]>([])
    const [companyPromptContext, setCompanyPromptContext] = useState<string>("")
    const [positionPromptContext, setPositionPromptContext] = useState<string>("")
    const [viewType, setViewType] = useState<ViewType>("dataGrid")
    const [mode, setMode] = useState<Mode>("parser")

    const logMessage = (message: string) => {
        setLogMessages((prev) => [message, ...prev]);
    };

    const handleChangeViewType = (event: SelectChangeEvent) => {
        setViewType(event.target.value as ViewType);
    }

    const handleChangeMode = (event: SelectChangeEvent) => {
        const newMode = event.target.value as Mode;
        setMode(newMode);
        const newTemplate =
            newMode === "researcher"
                ? "{company} AND {positions}"
                : "{company} AND {positions} AND {site}";
        setValue("search_query_template", newTemplate);

        logMessage(`Изменена стратегия на: ${event.target.value}`);
    };



    const onTestSearchQuery: SubmitHandler<IFormInput> = async (payload_data): Promise<boolean> => {
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
            sites: mode === "researcher" ? [] : payload_data.sites.split("\n"),
            positions: payload_data.positions.split("\n"),
            search_query_template: mode === "researcher"
                ? "{company} AND {positions}"
                : "{company} AND {positions} AND {site}",
            access_token: import.meta.env.VITE_ACCESS_TOKEN,
            company_prompt: mode === "parser" ? companyPromptContext : "",
            position_prompt: mode === "parser" ? positionPromptContext : "",
            max_lead_count: payload_data.max_lead_count,
            max_sites_count: payload_data.max_sites_count,
            openai_api_key: payload_data.openai_api_key,
            openai_api_base: payload_data.openai_api_base,
            mode: payload_data.mode
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
                const csv_row_with_id = {id: uuidv4(), ...csv_row}

                setCsvDownloadLink(csv_row.download_link);
                setRows((prev) => [...prev, csv_row_with_id]);
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


    const clearResults = () => {
        setRows([])
        setCsvDownloadLink("")
    }


    return (
        <Stack spacing={3}>
            <FormControl>
                <InputLabel id="modeLabel">Стратегия</InputLabel>
                <Select
                    labelId="modeLabel"
                    id="mode"
                    value={mode}
                    label="Мод"
                    onChange={handleChangeMode}
                >
                    <MenuItem value="parser">Парсер</MenuItem>
                    <MenuItem value="researcher">Ресерчер</MenuItem>
                </Select>
            </FormControl>

            {mode === "parser" && (
                <PromptForm
                    setCompanyPromptContext={setCompanyPromptContext}
                    setPositionPromptContext={setPositionPromptContext}
                />
            )}
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
                                    placeholder="{company} AND {positions}"
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
                    {mode === "parser" && (
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
                    )}
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
                    {mode === "parser" && (
                        <Box>
                            <Controller
                                name="max_lead_count"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Сколько лидов ищем"
                                        type="number"
                                        InputProps={{ inputProps: { min: 1 } }}
                                    />
                                )}
                            />
                        </Box>
                    )}

                    {mode === "researcher" && (
                        <Box>
                            <Controller
                                name="max_sites_count"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Сколько сайтов ищем"
                                        type="number"
                                        InputProps={{ inputProps: { min: 1 } }}
                                    />
                                )}
                            />
                        </Box>
                    )}

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
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="end">
                <Box flexGrow="1">
                    {csvDownloadLink !== "" && !loading ? (
                        <Link href={csvDownloadLink}>Скачать CSV</Link>
                    ) : (
                        <Box>Здесь будет ссылка для скачивания...</Box>
                    )}
                </Box>
                <FormControl>
                    <InputLabel id="viewTypeLabel">Отображение</InputLabel>
                    <Select
                        labelId="viewTypeLabel"
                        id="viewType"
                        value={viewType}
                        label="Тип отображения"
                        onChange={handleChangeViewType}
                    >
                        <MenuItem value="simple">Простое</MenuItem>
                        <MenuItem value="dataGrid">Для профи 😎</MenuItem>
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    disabled={!rows.length || loading}
                    onClick={clearResults}>
                    Сбросить таблицу и ссылку
                </Button>
            </Stack>
            {viewType === "dataGrid" ? <DataGridTable rows={rows}/> : <SimpleTable rows={rows}/>}
        </Stack>

    );
};

export default CreateCsvForm;