// src/components/PosterTable.tsx
import * as React from "react";
import {
  DataGrid,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import {
  Snackbar,
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  TextField,
  Stack,
  IconButton,
} from "@mui/material";
import type { GridColDef, GridRowId } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Close";
import { useAuth } from "../auth/AuthContext"; // Assuming path is correct
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Poster {
  id: number;
  title: string;
  author: string;
  score: number;
}

interface NewPoster {
  title: string;
  author: string;
  score: number | string; // Allow string for TextField input
}

export default function PosterTable() {
  const { api } = useAuth();
  const queryClient = useQueryClient();

  // State Management
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [confirmDelete, setConfirmDelete] = React.useState<Poster | null>(null);
  const [actionState, setActionState] = React.useState<{
    loading: Set<GridRowId>;
  }>({ loading: new Set() });
  const [isAdding, setIsAdding] = React.useState(false);
  const [newPoster, setNewPoster] = React.useState<NewPoster>({
    title: "",
    author: "",
    score: "",
  });

  // 🔹 Fetch posters query
  const {
    data,
    error: queryError,
    isLoading,
  } = useQuery<{ data: Poster[]; total: number }>({
    queryKey: ["posters", page, pageSize],
    queryFn: async () => {
      const res = await api.get(`/posters?page=${page + 1}&limit=${pageSize}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  // Generic mutation action state handler
  const onActionStart = (id: GridRowId) =>
    setActionState((prev) => ({
      ...prev,
      loading: new Set(prev.loading).add(id),
    }));
  const onActionEnd = (id: GridRowId) =>
    setActionState((prev) => {
      const newLoading = new Set(prev.loading);
      newLoading.delete(id);
      return { ...prev, loading: newLoading };
    });

  // 🔹 Create mutation
  const createMutation = useMutation({
    mutationFn: async (poster: Omit<Poster, "id">) => {
      const res = await api.post("/posters", poster);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posters"] });
      setIsAdding(false);
      setNewPoster({ title: "", author: "", score: "" });
    },
    onError: (err: any) => {
      setError(
        `Failed to create poster. ${err.response?.data?.message || err.message}`
      );
    },
  });

  // 🔹 Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/posters/${id}`);
      return id;
    },
    onMutate: onActionStart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posters"] });
    },
    onError: (err: any, id) => {
      const originalRow = data?.data.find((r) => r.id === id);
      setError(
        `Failed to delete "${originalRow?.title || `row ${id}`}". ${
          err.response?.data?.message || err.message
        }`
      );
    },
    onSettled: (id) => id && onActionEnd(id),
  });

  // 🔹 Update mutation
  const updateMutation = useMutation({
    mutationFn: async (poster: Poster) => {
      await api.put(`/posters/${poster.id}`, poster);
      return poster;
    },
    onMutate: (variables) => onActionStart(variables.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posters"] });
    },
    onError: (err: any, variables) => {
      setError(
        `Failed to update "${variables.title}". ${
          err.response?.data?.message || err.message
        }`
      );
    },
    onSettled: (data) => data && onActionEnd(data.id),
  });

  // --- Handlers ---

  const processRowUpdate = async (newRow: Poster, oldRow: Poster) => {
    if (!newRow.title.trim() || !newRow.author.trim()) {
      setError("Title and Author cannot be empty.");
      return oldRow;
    }
    const score = Number(newRow.score);
    if (isNaN(score) || score < 0 || score > 100) {
      setError("Score must be a number between 0 and 100.");
      return oldRow;
    }

    try {
      const updatedRow = await updateMutation.mutateAsync({ ...newRow, score });
      return updatedRow;
    } catch {
      return oldRow; // Revert on API error
    }
  };

  const handleAddNew = () => {
    const score = Number(newPoster.score);
    if (!newPoster.title.trim() || !newPoster.author.trim()) {
      setError("Please fill out Title and Author.");
      return;
    }
    if (isNaN(score) || score < 0 || score > 100) {
      setError("Score must be a number between 0 and 100.");
      return;
    }
    createMutation.mutate({ ...newPoster, score });
  };

  const handleDeleteClick = (poster: Poster) => setConfirmDelete(poster);
  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteMutation.mutate(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const columns: GridColDef[] = [
    { field: "title", headerName: "Title", flex: 1, editable: true },
    { field: "author", headerName: "Author", flex: 1, editable: true },
    {
      field: "score",
      headerName: "Score",
      type: "number",
      flex: 0.5,
      editable: true,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: (params) => {
        const isLoading = actionState.loading.has(params.id);
        if (isLoading) {
          return [<CircularProgress size={24} key="loading" />];
        }
        return [
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => handleDeleteClick(params.row)}
            color="error"
          />,
        ];
      },
    },
  ];

  return (
    <>
      <Snackbar
        open={!!error || !!queryError}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: "100%" }}>
          {error || (queryError as any)?.message}
        </Alert>
      </Snackbar>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the poster: "
            {confirmDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ width: "100%", mb: 2 }}>
        {isAdding ? (
          <Stack direction="row" spacing={2} component="form" sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
            <TextField
              label="Title"
              value={newPoster.title}
              onChange={(e) => setNewPoster({ ...newPoster, title: e.target.value })}
              size="small"
              sx={{ flex: 2 }}
            />
            <TextField
              label="Author"
              value={newPoster.author}
              onChange={(e) => setNewPoster({ ...newPoster, author: e.target.value })}
              size="small"
              sx={{ flex: 2 }}
            />
            <TextField
              label="Score"
              type="number"
              value={newPoster.score}
              onChange={(e) => setNewPoster({ ...newPoster, score: e.target.value })}
              size="small"
              sx={{ flex: 1 }}
            />
            <IconButton onClick={handleAddNew} color="primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? <CircularProgress size={24} /> : <SaveIcon />}
            </IconButton>
            <IconButton onClick={() => setIsAdding(false)} color="inherit">
              <CancelIcon />
            </IconButton>
          </Stack>
        ) : (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setIsAdding(true)}
            variant="contained"
          >
            Add New Poster
          </Button>
        )}
      </Box>

      <Box sx={{ height: "calc(100vh - 250px)", width: "100%" }}>
        <DataGrid
          rows={data?.data || []}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          rowCount={data?.total || 0}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50]}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={({ page: newPage, pageSize: newPageSize }) => {
            setPage(newPage);
            setPageSize(newPageSize);
          }}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(err) => setError(err.message)}
          editMode="row"
        />
      </Box>
    </>
  );
}
