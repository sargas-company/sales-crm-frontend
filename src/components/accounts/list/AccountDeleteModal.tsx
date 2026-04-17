import { DeleteOutline } from "@mui/icons-material";
import Modal from "../../modal/Modal";
import ModalContentLayout from "../../users/layout/ModalContentLayout";
import Box from "../../box/Box";
import { Text, Button, Divider } from "../../../ui";
import { useDeleteAccountMutation } from "../../../store/accounts/accountsApi";
import { useToast } from "../../../context/toast/ToastContext";

interface Props {
  id: string;
  title: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AccountDeleteModal = ({ id, title, onClose, onSuccess }: Props) => {
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();
  const { showToast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteAccount(id).unwrap();
      showToast("Account deleted successfully", "success");
      onSuccess();
      onClose();
    } catch {
      showToast("Failed to delete account. Please try again.", "error");
    }
  };

  return (
    <Modal handleOutClick={onClose}>
      <ModalContentLayout maxWidth="440px">
        <Box display="flex" flexDirection="column" align="center" space={2} padding={8}>
          <Box
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(255,76,76,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DeleteOutline style={{ fontSize: 28, color: "#ff4c4c" }} />
          </Box>

          <Box display="flex" flexDirection="column" align="center" space={1}>
            <Text heading="h5" align="center">Delete account?</Text>
            <Text varient="body2" secondary align="center">
              Are you sure you want to delete{" "}
              <strong>"{title}"</strong>?{" "}
              This action cannot be undone.
            </Text>
          </Box>

          <Divider styles={{ width: "100%", margin: "0.5rem 0" }} />

          <Box display="flex" justify="center" space={2} style={{ width: "100%" }}>
            <Button varient="outlined" color="info" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button color="error" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting…" : "Delete"}
            </Button>
          </Box>
        </Box>
      </ModalContentLayout>
    </Modal>
  );
};

export default AccountDeleteModal;
