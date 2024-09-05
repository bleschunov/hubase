import { useEffect, useState } from "react";
import { Stack, TextField } from "@mui/material";
import { Controller, useForm} from "react-hook-form";
import LoadingButton from "@mui/lab/LoadingButton";
import { Prompt } from "../models/Prompt";

// Укажите типы пропсов для компонента
interface PromptFormProps {
  setCompanyPromptContext: (prompt: string) => void;
  setPositionPromptContext: (prompt: string) => void;
}

interface FormInput {
  name: string;
  prompt_text: string;
}

const PromptForm: React.FC<PromptFormProps> = ({ setCompanyPromptContext, setPositionPromptContext }) => {
  const [loading, setLoading] = useState<boolean>(false);

  const isContainsVariables = (value: string): string | true => {
    if (!value.includes("{person}") || !value.includes("{context}")) {
      return "Промпт должен содержать переменные: {person}, {context}";
    }
    return true;
  };

  const {
    control: companyControl,
    handleSubmit: companyHandleSubmit,
    setValue: setCompanyValue,
    formState: { errors: companyErrors },
    setError: setCompanyError,
  } = useForm<FormInput>({
    defaultValues: {
      prompt_text: "",
      name: "company",
    },
  });

  const {
    control: positionControl,
    handleSubmit: positionHandleSubmit,
    setValue: setPositionValue,
    formState: { errors: positionErrors },
    setError: setPositionError,
  } = useForm<FormInput>({
    defaultValues: {
      prompt_text: "",
      name: "position",
    },
  });

  useEffect(() => {
    const promises: Promise<void>[] = [];

    const companyValue = localStorage.getItem("company");
    if (companyValue === null) {
      promises.push(
        fetch(`${import.meta.env.VITE_API_BASE_URL}/prompt/company`)
          .then(resp => resp.json())
          .then((prompt: Prompt) => {
            setCompanyValue("prompt_text", prompt.prompt_text);
            setCompanyPromptContext(prompt.prompt_text);
          })
      );
    } else {
      setCompanyValue("prompt_text", companyValue);
      setCompanyPromptContext(companyValue);
    }

    const positionValue = localStorage.getItem("position");
    if (positionValue === null) {
      promises.push(
        fetch(`${import.meta.env.VITE_API_BASE_URL}/prompt/position`)
          .then(resp => resp.json())
          .then((prompt: Prompt) => {
            setPositionValue("prompt_text", prompt.prompt_text);
            setPositionPromptContext(prompt.prompt_text);
          })
      );
    } else {
      setPositionValue("prompt_text", positionValue);
      setPositionPromptContext(positionValue);
    }

    Promise.all(promises).catch(console.error);
  }, [setCompanyPromptContext, setPositionPromptContext, setCompanyValue, setPositionValue]);

  const onUpdatePrompt = (payload: FormInput, valueCb: (value: string) => void, errorCb: (msg: string) => void) => {
    const error = isContainsVariables(payload.prompt_text);
    if (error !== true) {
      errorCb(error);
      return;
    }

    valueCb(payload.prompt_text);
    localStorage.setItem(payload.name, payload.prompt_text);
  };

  const onResetPrompt = (payload: FormInput, cb: (fieldName: "prompt_text", value: string) => void) => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/prompt/${payload.name}/reset`, {
      method: "PATCH",
    })
      .then(resp => resp.json())
      .then((prompt: Prompt) => {
        cb("prompt_text", prompt.prompt_text);
        localStorage.setItem(payload.name, prompt.prompt_text);
      })
      .finally(() => setLoading(false))
      .catch(console.error);
  };

  return (
    <Stack spacing={3}>
      <form>
        <Stack spacing={2}>
          <Controller
            name="prompt_text"
            control={companyControl}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!companyErrors.prompt_text}
                helperText={companyErrors.prompt_text?.message}
                id="outlined-textarea"
                label="Промпт, чтобы узнать, в какой компании работает сотрудник"
                multiline
                rows={4}
              />
            )}
          />
          <Stack direction="row" spacing={2}>
            <LoadingButton
              loading={loading}
              variant="outlined"
              onClick={companyHandleSubmit(payload => onResetPrompt(payload, setCompanyValue))}
            >
              Откатить
            </LoadingButton>
            <LoadingButton
              loading={loading}
              variant="contained"
              onClick={companyHandleSubmit(payload => onUpdatePrompt(
                payload,
                (value: string) => setCompanyPromptContext(value),
                (msg: string) => setCompanyError("prompt_text", { type: "not_set_variable", message: msg })
              ))}
            >
              Обновить
            </LoadingButton>
          </Stack>
        </Stack>
      </form>
      <form>
        <Stack spacing={2}>
          <Controller
            name="prompt_text"
            control={positionControl}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!positionErrors.prompt_text}
                helperText={positionErrors.prompt_text?.message}
                id="outlined-textarea"
                label="Промпт, чтобы узнать, на какой позиции работает сотрудник"
                multiline
                rows={4}
              />
            )}
          />
          <Stack direction="row" spacing={2}>
            <LoadingButton
              loading={loading}
              variant="outlined"
              onClick={positionHandleSubmit(payload => onResetPrompt(payload, setPositionValue))}
            >
              Откатить
            </LoadingButton>
            <LoadingButton
              loading={loading}
              variant="contained"
              onClick={positionHandleSubmit(payload => onUpdatePrompt(
                payload,
                (value: string) => setPositionPromptContext(value),
                (msg: string) => setPositionError("prompt_text", { type: "not_set_variable", message: msg })
              ))}
            >
              Обновить
            </LoadingButton>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};

export default PromptForm;
