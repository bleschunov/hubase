import json
import typing as t
from dataclasses import dataclass
from logging import Logger

from openai import OpenAI

from word_classifications.abc_ import IWordClassifications


@dataclass(frozen=True)
class WordClassification:
    name: str
    source: str


class WordClassificationsWithGPT(IWordClassifications):
    def __init__(
        self,
        text: str,
        prompt_template: str,
        api_key: str,
        logger: Logger,
        *,
        batch_size: int = 2000
    ) -> None:
        if "{input}" not in prompt_template:
            raise ValueError("Переменная {input} должна быть в промпте.")

        self.__text = text
        self.__prompt_template = prompt_template
        self.__api_key = api_key
        self.__client = OpenAI(api_key=self.__api_key)
        self.__logger = logger
        self.__batch_size = batch_size

    def iter(self) -> t.Iterator[WordClassification]:
        for batch in self.__text_batches():
            prompt = self.__prompt_template.format(input=batch)

            response = self.__safely_call_gpt(prompt)
            self.__logger.info(f"Получен ответ от GPT-4: {response[:22] + '...'}")

            names = self.__parse_gpt_response(response)

            for name in names:
                yield WordClassification(
                    name=name,
                    source=batch,
                )

    def __text_batches(self) -> t.Iterator[str]:
        for i in range(0, len(self.__text), self.__batch_size):
            yield self.__text[i:i + self.__batch_size]

    def __safely_call_gpt(self, prompt: str) -> str:
        try:
            response = self.__client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                temperature=0,
            )

        except Exception as e:
            self.__logger.warning(f"Ошибка при запросе к GPT-4: {str(e)}")
            raise e

        else:
            return response.choices[0].message.content.strip()

    def __parse_gpt_response(self, response: str) -> list[str]:
        try:
            response = json.loads(response)
        except json.JSONDecodeError as e:
            self.__logger.error(f"Ошибка. От GPT пришёл не JSON.")
            raise e

        if not isinstance(response, list):
            self.__logger.error(f"Ошибка. Ответ GPT это не массив строк, как ожидалось.")
            raise ValueError("GPT ответила не в ожидаемом формате")

        return response


if __name__ == "__main__":
    import logging

    logger = logging.getLogger(__name__)
    logger.setLevel("INFO")

    text = """Вторая секция началась с КРУГЛОГО СТОЛА «Роль контроллинга в оптимизации бизнес-процессов». Среди 
спикеров: Мария Давыдкина, руководитель отдела организационного развития и бизнес-процессов, РАСУ, Росатом 
(модератор); Елена Шипилова, финансовый директор, Багерстат РУС; Иван Чорба, заместитель директора департамента 
экономики и контроллинга, Росэнергоатом; Михаил Наталенко, заместитель генерального директора по финансам и 
экономике, Р-Альянс; Юлия Максакова, директор, ARKA Merchants Ltd, Ирландия. Они обсудили следующие темы:
"""

    prompt_template = """Найди во входном тексте имена и фамилии.
Пропускай имена без фамилии или фамилии без имени.
Ответ напиши в виде JSON массива. Если в тексте нет имен и фамилий, напиши пустой JSON массив.
Кроме JSON ничего не пиши.

Пример 1. 
Вход: 
Первая секция «Повышение эффективности контроллинга в условиях быстро меняющейся экономической ситуации» началась с 
доклада Юлии Максаковой, директора, ARKA Merchants Ltd, Ирландия, о преодолении кризиса 2022-2023 годов с помощью 
операционного планирования. Эксперт рассмотрела проблемы предприятия, попавшего под санкционные требования ЕС, и 
отметила основные драйверы бизнес-процесса в упаковочном бизнесе. Это OEE (операционная эффективность оборудования), 
управление запасами и расходы на конверсию. Также Юлия поделилась инструментами для решения возникших сложностей и 
перечислила задачи и KPI компании на 2023 год.

Денис Петренчук, начальник управления интегрированного планирования и контроллинга, Газпром нефть, поделился опытом 
повышения операционной эффективности с помощью контроллинга. Спикер привел краткий обзор существующих определений и 
концепций контроллинга и рассказал про эволюцию подходов к контроллингу в условиях постоянных изменений. Затем Денис 
рассмотрел использование КПЭ как инструмента повышения операционной эффективности в цепях поставок. «КПЭ ЦДС, 
методология которых сформирована и прошла апробацию, подлежат формализации в виде цифровых паспортов, учету и 
согласованию ответственными лицами», – отметил докладчик.
Выход: 
["Юлия Максакова", "Денис Петренчук"]

Пример 2.
Вход:
17 августа 2023 года в Москве в пятнадцатый раз прошла Конференция «Корпоративный контроллинг» в формате онлайн. 
Мероприятие было организовано группой Prosperity Media при поддержке портала CFO Russia. Представляем вашему вниманию 
отчет о мероприятии.

Чтобы приобрести материалы конференции, звоните по телефону +7 (495) 971-92-18 или пишите на электронный адрес 
events@cfo-russia.ru.
Выход:
[]

Вход: {input}
Выход:
"""

    for classification in WordClassificationsWithGPT(
        text=text,
        prompt_template=prompt_template,
        api_key="",
        logger=logger
    ).iter():
        print(classification)
