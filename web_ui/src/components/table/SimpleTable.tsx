import React from "react";
import {Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {IRowWithId} from "../../models/CsvResponse.ts";

interface Props {
    rows: IRowWithId[]
}

const SimpleTable: React.FC<Props> = ({rows}) => {
    return (
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
                    {rows.map(row => (
                        <TableRow key={row.id}
                                  sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                            <TableCell component="th"
                                       scope="row">{row.name}</TableCell>
                            <TableCell>{row.position}</TableCell>
                            <TableCell>{row.searched_company}</TableCell>
                            <TableCell>{row.inferenced_company}</TableCell>
                            <TableCell><Link href={row.original_url} target="_blank">
                                {row.original_url}</Link></TableCell>
                            <TableCell>{row.source}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default SimpleTable
