import { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../card/Card";
import Box from "../../box/Box";
import { GridInnerContainer, GridItem } from "../../layout";
import {
  Text, TextField, Button, Divider, DividerWithLabel,
  Toggle, Select, SelectItem,
} from "../../../ui";
import { useCreateProposalMutation } from "../../../store/proposals/proposalsApi";
import { useToast } from "../../../context/toast/ToastContext";
import useProposalForm from "./useProposalForm";
import parseServerError from "../../../utils/parseServerError";

const AddMain = () => {
  const navigate  = useNavigate();
  const { showToast } = useToast();
  const { fields, errors, setField, runValidation, getPayload } = useProposalForm();
  const [createProposal, { isLoading }] = useCreateProposalMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!runValidation()) return;
    try {
      await createProposal(getPayload()).unwrap();
      showToast("Proposal created successfully", "success");
      navigate("/proposal/list");
    } catch (err) {
      showToast(parseServerError(err), "error");
    }
  };

  return (
    <Card py="1.5rem" px="2rem">
      <Box mb={4}>
        <Text heading="h5">New Proposal</Text>
        <Text varient="body2" secondary>
          Fill in the details below to create a new proposal
        </Text>
      </Box>

      <Divider styles={{ margin: "0 0 1.5rem" }} />

      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" space={4}>

          {/* ── Main Details ─────────────────────────────────── */}
          <Box>
            <DividerWithLabel label="Main Details" />
            <Box mt={3}>
              <GridInnerContainer spacing={2}>
                <GridItem xs={12} md={6}>
                  <TextField
                    name="manager"
                    label="Manager *"
                    placeholder="e.g. John Doe"
                    value={fields.manager}
                    onChange={(e) => setField("manager", e.target.value)}
                    error={!!errors.manager}
                    hypertext={errors.manager}
                    width="100%"
                  />
                </GridItem>

                <GridItem xs={12} md={6}>
                  <TextField
                    name="account"
                    label="Account *"
                    placeholder="e.g. Dmytro Dev"
                    value={fields.account}
                    onChange={(e) => setField("account", e.target.value)}
                    error={!!errors.account}
                    hypertext={errors.account}
                    width="100%"
                  />
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Proposal Type *</Text>
                    <Select
                      label="Select type"
                      defaultValue={fields.proposalType}
                      onChange={(value) => setField("proposalType", value as any)}
                      width="100%"
                      sizes="normal"
                    >
                      <SelectItem label="Bid"            value="Bid" />
                      <SelectItem label="Invite"         value="Invite" />
                      <SelectItem label="Direct Message" value="Direct Message" />
                    </Select>
                    {errors.proposalType && (
                      <Text varient="caption" color="error">{errors.proposalType}</Text>
                    )}
                  </Box>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Platform</Text>
                    <Select
                      label="Select platform"
                      defaultValue={fields.platform}
                      onChange={(value) => setField("platform", value as any)}
                      width="100%"
                      sizes="normal"
                    >
                      <SelectItem label="Upwork"   value="Upwork" />
                      <SelectItem label="LinkedIn" value="LinkedIn" />
                      <SelectItem label="Jobble"   value="Jobble" />
                    </Select>
                  </Box>
                </GridItem>
              </GridInnerContainer>
            </Box>
          </Box>

          {/* ── Job Details ───────────────────────────────────── */}
          <Box>
            <DividerWithLabel label="Job Details" />
            <Box mt={3}>
              <GridInnerContainer spacing={2}>
                <GridItem xs={12} md={8}>
                  <TextField
                    name="jobUrl"
                    label="Job URL"
                    placeholder="https://www.upwork.com/jobs/~..."
                    value={fields.jobUrl}
                    onChange={(e) => setField("jobUrl", e.target.value)}
                    width="100%"
                  />
                </GridItem>

                <GridItem xs={12} md={4}>
                  <TextField
                    name="connects"
                    label="Connects"
                    type="number"
                    value={fields.connects}
                    onChange={(e) => setField("connects", e.target.value)}
                    width="100%"
                    minValue={0}
                  />
                </GridItem>

                <GridItem xs={12}>
                  <Box display="flex" align="center" space={2}>
                    <Toggle
                      toggled={fields.boosted}
                      onToggle={() => setField("boosted", !fields.boosted)}
                      label="Boosted proposal"
                    />
                  </Box>
                </GridItem>
              </GridInnerContainer>
            </Box>
          </Box>

          {/* ── Content ───────────────────────────────────────── */}
          <Box>
            <DividerWithLabel label="Content" />
            <Box mt={3} display="flex" flexDirection="column" space={3}>
              <Box display="flex" flexDirection="column" space={1}>
                <Text varient="body2" weight="medium">Vacancy Description</Text>
                <TextField
                  name="vacancy"
                  placeholder="Paste the job description from the platform…"
                  value={fields.vacancy}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setField("vacancy", e.target.value)
                  }
                  multiRow
                  width="100%"
                  style={{ minHeight: 120, resize: "vertical" }}
                />
              </Box>

              <Box display="flex" flexDirection="column" space={1}>
                <Text varient="body2" weight="medium">Cover Letter</Text>
                <TextField
                  name="coverLetter"
                  placeholder="Write your cover letter…"
                  value={fields.coverLetter}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setField("coverLetter", e.target.value)
                  }
                  multiRow
                  width="100%"
                  style={{ minHeight: 160, resize: "vertical" }}
                />
              </Box>

              <GridInnerContainer spacing={2}>
                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Comment</Text>
                    <TextField
                      name="comment"
                      placeholder="Internal note about the client or job…"
                      value={fields.comment}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setField("comment", e.target.value)
                      }
                      multiRow
                      width="100%"
                      style={{ minHeight: 100, resize: "vertical" }}
                    />
                  </Box>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Context</Text>
                    <TextField
                      name="context"
                      placeholder="Budget, client rating, location…"
                      value={fields.context}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setField("context", e.target.value)
                      }
                      multiRow
                      width="100%"
                      style={{ minHeight: 100, resize: "vertical" }}
                    />
                  </Box>
                </GridItem>
              </GridInnerContainer>
            </Box>
          </Box>

          {/* ── Actions ───────────────────────────────────────── */}
          <Box display="flex" justify="flex-end" space={1} mt={2}>
            <Button
              varient="outlined"
              color="info"
              type="button"
              onClick={() => navigate("/proposal/list")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating…" : "Create Proposal"}
            </Button>
          </Box>

        </Box>
      </form>
    </Card>
  );
};

export default AddMain;
