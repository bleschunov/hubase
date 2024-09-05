import {IRowWithId} from "../../models/CsvResponse.ts";
import React from "react";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {Link} from "@mui/material";

interface Props {
    rows: IRowWithId[]
}

const columns: GridColDef<IRowWithId>[] = [
    {
        field: 'name',
        headerName: 'Имя',
    },
    {
        field: 'position',
        headerName: 'Должность',
    },
    {
        field: 'searched_company',
        headerName: 'Искомая компания',
    },
    {
        field: 'inferenced_company',
        headerName: 'Реальная компания',
    },
    {
        field: 'original_url',
        headerName: 'Ссылка на источник',
        renderCell: (params) => (
            <Link href={params.value}>{params.value}</Link>
        )
    },
    {
        field: 'source',
        headerName: 'Пруф из источника',
        width: "40%",
    },
];

const DataGridTable: React.FC<Props> = ({rows}) => {
    return (
        <DataGrid
            getRowHeight={() => 'auto'}
            rows={rows}
            columns={columns}
            checkboxSelection
        />
    )
}

export default DataGridTable
