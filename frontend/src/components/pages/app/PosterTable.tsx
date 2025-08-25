// src/components/PosterTable.tsx
import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { Snackbar, Alert } from "@mui/material";
import { TextField, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useAuth } from '../auth/AuthContext';

export default function PosterTable() {
  const { api, isAuthenticated } = useAuth();
  const [rows, setRows] = React.useState([]);
  const [error, setError] = React.useState<string | null>(null);

const handleRowUpdate = async (newRow: any, oldRow: any) => {
  // Validate before saving

  if (!newRow.title || newRow.title.trim() === "") {
    return oldRow
  }
  if (!newRow.author || newRow.author.trim() === "") {
    return oldRow
  }
  if (isNaN(newRow.score) || newRow.score < 0 || newRow.score > 100) {
    return oldRow
  }
   
  // ✅ Only send update if valid
  await axios.put(`http://localhost:8000/api/v1/posters/${newRow.id}`, newRow);
  return newRow;
};

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/v1/posters/${id}`);
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete row");
    }
  };


  // Helper function to generate error messages
  const getErrorMessage = (field: string, value: any) => {
    if (field === "title" && (!value || value.trim() === "")) return "Title cannot be empty";
    if (field === "author" && (!value || value.trim() === "")) return "Author cannot be empty";
    if (field === "score") {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) return "Score must be 0–100";
    }
    return "";
  };

const columns: GridColDef[] = [
    {
      field: "title",
      headerName: "Title",
      flex: 1,
      editable: true,
      renderEditCell: (params) => {
        const errorMsg = getErrorMessage("title", params.value);
        return (
          <TextField
            value={params.value}
            onChange={(e) => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value })}
            error={!!errorMsg}
            helperText={errorMsg}
            variant="standard"
            fullWidth
          />
        );
      },
    },
    {
      field: "author",
      headerName: "Author",
      flex: 1,
      editable: true,
      renderEditCell: (params) => {
        const errorMsg = getErrorMessage("author", params.value);
        return (
          <TextField
            value={params.value}
            onChange={(e) => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value })}
            error={!!errorMsg}
            helperText={errorMsg}
            variant="standard"
            fullWidth
          />
        );
      },
    },
    {
      field: "score",
      headerName: "Score",
      type: "number",
      flex: 0.5,
      editable: true,
      renderEditCell: (params) => {
        const errorMsg = getErrorMessage("score", params.value);
        return (
          <TextField
            value={params.value}
            onChange={(e) => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value })}
            error={!!errorMsg}
            helperText={errorMsg}
            variant="standard"
            fullWidth
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Delete",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          color="error"
          onClick={() => handleDelete(params.row.id)}
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];



  React.useEffect(() => {
   api.get('/posters')
      .then((res) => setRows(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
    <Snackbar
      open={!!error}
      autoHideDuration={4000}
      onClose={() => setError(null)}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert severity="error" onClose={() => setError(null)}>
        {error}
      </Alert>
    </Snackbar>
    <div style={{ height: 400, width: "95%" }}>
    <DataGrid
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  pageSizeOptions={[10, 25, 50, 100]}
  pagination
  processRowUpdate={handleRowUpdate}
  onProcessRowUpdateError={(error) => {
    console.error(error);
    setError(error.message || "An unexpected error occurred");
  }}
  sx={{
    "& .MuiDataGrid-columnHeader": {
      backgroundColor: "#6e9ecfff",
      color: "#080808ff",
      fontSize: "1rem",
      boxShadow: "0px 2px 5px rgba(0,0,0,0.2)",
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: "bold",
    },
    "& .MuiDataGrid-row": {
      "&:nth-of-type(odd)": {
        backgroundColor: "#fafafa",
      },
    },
  }}
/>
    </div>
      </>
  );
}