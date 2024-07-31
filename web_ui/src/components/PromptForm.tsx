import {useEffect, useState} from "react";
import {Stack, TextField} from "@mui/material";
import {Controller, useForm} from "react-hook-form";
import LoadingButton from "@mui/lab/LoadingButton";
import {Prompt} from "../models/Prompt.ts";

interface FormInput {
  name: string;
  prompt_text: string;
}

const PromptForm = () => {
  const [loading, setLoading] = useState<boolean>(false)

  const isContainsVariables = value => {
    if (!value.includes("{person}") || !value.includes("{context}")) {
      return "Промпт должен содержать переменные: {person}, {context}";
    }
    return true
  }

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
  })

  const {
    control: positionControl,
    handleSubmit: positionHandleSubmit,
    setValue: setPositionValue,
    formState: { errors: positionErrors },
    setError: setPositionError,
  } = useForm({
    defaultValues: {
      prompt_text: "",
      name: "position",
    }
  })

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_BASE_URL}/prompt/company`)
        .then(resp => resp.json())
        .then((prompt: Prompt) => setCompanyValue("prompt_text", prompt.prompt_text)),
      fetch(`${import.meta.env.VITE_API_BASE_URL}/prompt/position`)
        .then(resp => resp.json())
        .then((prompt: Prompt) => setPositionValue("prompt_text", prompt.prompt_text)),
    ])
  }, [])

  // const onUpdateCompanyPrompt: SubmitHandler<FormInput> = (payload)

  const onUpdatePrompt = (payload: FormInput, value_cb, error_cb) => {
    const error = isContainsVariables(payload.prompt_text)
    if (error !== true) {
      error_cb(error)
      return
    }

    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/prompt`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json;charset=utf-8"
        },
      }
    )
      .then(resp => resp.json())
      .then((prompt: Prompt) => value_cb("prompt_text", prompt.prompt_text))
      .then(() => setLoading(false))

  }

  const onResetPrompt = (payload: FormInput, cb) => {
    setLoading(true)
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/prompt/${payload.name}/reset`,
      {
        method: "PATCH"
      }
    )
      .then(resp => resp.json())
      .then((prompt: Prompt) => cb("prompt_text", prompt.prompt_text))
      .then(() => setLoading(false))
  }

  return (
    <Stack spacing={3}>
      <form>
        <Stack spacing={2}>
          <Controller
            name="prompt_text"
            control={companyControl}
            render={({ field }) =>
              <TextField
                {...field}
                error={Object.entries(companyErrors).length > 0}
                helperText={Object.entries(companyErrors).length > 0 && companyErrors?.prompt_text.message}
                id="outlined-textarea"
                label="Промпт, чтобы узнать, в какой компании работает сотрудник"
                multiline
                rows={4}
              />
            }
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
                setCompanyValue,
                (msg: string) => setCompanyError("prompt_text", {"type": "not_set_variable", "message": msg})
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
            render={({ field }) =>
              <TextField
                {...field}
                error={Object.entries(positionErrors).length > 0}
                helperText={Object.entries(positionErrors).length > 0 && positionErrors?.prompt_text.message}
                id="outlined-textarea"
                label="Промпт, чтобы узнать, на какой позиции работает сотрудник"
                multiline
                rows={4}
              />
            }
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
                  setPositionValue,
                  (msg: string) => setPositionError("prompt_text", {"type": "not_set_variable", "message": msg})
                ))}
              >
                Обновить
              </LoadingButton>
          </Stack>
        </Stack>
      </form>
    </Stack>
  )
}

export default PromptForm