import { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../card/Card";
import Box from "../../box/Box";
import { GridInnerContainer, GridItem } from "../../layout";
import {
  Text, TextField, Button, Divider,
  Toggle, Select, SelectItem,
} from "../../../ui";
import {
  useCreateProposalMutation,
  useUpdateProposalMutation,
  useGetProposalByIdQuery,
} from "../../../store/proposals/proposalsApi";
import { useGetAccountsQuery } from "../../../store/accounts/accountsApi";
import { useGetPlatformsQuery } from "../../../store/platforms/platformsApi";
import { useToast } from "../../../context/toast/ToastContext";
import useProposalForm from "../add/useProposalForm";
import parseServerError from "../../../utils/parseServerError";
import type { ProposalItem } from "../../../store/proposals/types/definition";

interface ProposalFormProps {
  mode: "create" | "edit";
  id?: string;
}

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    varient="caption"
    weight="medium"
    secondary
    classes="section-label"
    style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
  >
    {children}
  </Text>
);

const toFormValues = (data: ProposalItem) => ({
  title:        data.title,
  accountId:    data.accountId,
  platformId:   data.platformId,
  proposalType: data.proposalType,
  status:       data.status,
  jobUrl:       data.jobUrl ?? "",
  boosted:      data.boosted,
  connects:     String(data.connects),
  coverLetter:  data.coverLetter,
  vacancy:      data.vacancy ?? "",
});

const ProposalFormInner = ({
  mode,
  id,
  initialData,
}: ProposalFormProps & { initialData?: ProposalItem }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { fields, errors, setField, runValidation, getPayload } = useProposalForm(
    initialData ? toFormValues(initialData) : undefined
  );

  const { data: accounts = [], isLoading: accountsLoading } = useGetAccountsQuery();
  const { data: platforms = [], isLoading: platformsLoading } = useGetPlatformsQuery();

  const [createProposal, { isLoading: isCreating }] = useCreateProposalMutation();
  const [updateProposal, { isLoading: isUpdating }] = useUpdateProposalMutation();
  const isLoading = isCreating || isUpdating;

  const handleAccountChange = (accountId: string) => {
    setField("accountId", accountId);
    const account = accounts.find((a) => a.id === accountId);
    if (account) setField("platformId", account.platformId);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!runValidation()) return;
    try {
      if (mode === "edit" && id) {
        await updateProposal({ id, body: getPayload() }).unwrap();
        showToast("Proposal updated successfully", "success");
      } else {
        const { status: _omit, ...createPayload } = getPayload();
        await createProposal(createPayload).unwrap();
        showToast("Proposal created successfully", "success");
      }
      navigate("/proposal/list");
    } catch (err) {
      showToast(parseServerError(err), "error");
    }
  };

  return (
    <Card py="2rem" px="2rem">
      <Box style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <Box mb={5}>
          <Text heading="h5">{mode === "edit" ? "Edit Proposal" : "New Proposal"}</Text>
          <Box mt={1}>
            <Text varient="body2" secondary>
              {mode === "edit"
                ? "Update the proposal details below"
                : "Fill in the details to create a new proposal"}
            </Text>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" space={5}>

            {/* ── Title ── */}
            <Box display="flex" flexDirection="column" space={1}>
              <Text varient="body2" weight="medium">Title *</Text>
              <TextField
                name="title"
                placeholder="e.g. React developer for SaaS product"
                value={fields.title}
                onChange={(e) => setField("title", e.target.value)}
                error={!!errors.title}
                hypertext={errors.title}
                width="100%"
              />
            </Box>

            <Divider />

            {/* ── Main Details ── */}
            <Box display="flex" flexDirection="column" space={3}>
              <SectionLabel>Main Details</SectionLabel>
              <GridInnerContainer spacing={2}>

                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Developer Account *</Text>
                    <Select
                      label={accountsLoading ? "Loading…" : "Select account"}
                      defaultValue={fields.accountId}
                      onChange={(value) => handleAccountChange(value as string)}
                      width="100%"
                      sizes="normal"
                    >
                      {accounts.map((acc) => (
                        <SelectItem
                          key={acc.id}
                          label={`${acc.firstName} ${acc.lastName} (${acc.platform.title})`}
                          value={acc.id}
                        />
                      ))}
                    </Select>
                    {errors.accountId && (
                      <Text varient="caption" color="error">{errors.accountId}</Text>
                    )}
                  </Box>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Platform</Text>
                    <Select
                      label={platformsLoading ? "Loading…" : "Select platform"}
                      defaultValue={fields.platformId}
                      onChange={(value) => setField("platformId", value as string)}
                      width="100%"
                      sizes="normal"
                    >
                      {platforms.map((p) => (
                        <SelectItem key={p.id} label={p.title} value={p.id} />
                      ))}
                    </Select>
                  </Box>
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
                      <SelectItem label="Direct Message" value="DirectMessage" />
                    </Select>
                    {errors.proposalType && (
                      <Text varient="caption" color="error">{errors.proposalType}</Text>
                    )}
                  </Box>
                </GridItem>

                {mode === "edit" && (
                  <GridItem xs={12} md={6}>
                    <Box display="flex" flexDirection="column" space={1}>
                      <Text varient="body2" weight="medium">Status</Text>
                      <Select
                        label="Select status"
                        defaultValue={fields.status}
                        onChange={(value) => setField("status", value as any)}
                        width="100%"
                        sizes="normal"
                      >
                        <SelectItem label="Draft"   value="Draft" />
                        <SelectItem label="Sent"    value="Sent" />
                        <SelectItem label="Viewed"  value="Viewed" />
                        <SelectItem label="Replied" value="Replied" />
                      </Select>
                    </Box>
                  </GridItem>
                )}

              </GridInnerContainer>
            </Box>

            <Divider />

            {/* ── Job Details ── */}
            <Box display="flex" flexDirection="column" space={3}>
              <SectionLabel>Job Details</SectionLabel>
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
                  <Toggle
                    toggled={fields.boosted}
                    onToggle={() => setField("boosted", !fields.boosted)}
                    label="Boosted proposal"
                  />
                </GridItem>

              </GridInnerContainer>
            </Box>

            <Divider />

            {/* ── Content ── */}
            <Box display="flex" flexDirection="column" space={3}>
              <SectionLabel>Content</SectionLabel>

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
                  style={{ minHeight: 100, resize: "vertical" }}
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
                  style={{ minHeight: 140, resize: "vertical" }}
                />
              </Box>

            </Box>

            {/* ── Actions ── */}
            <Box display="flex" justify="flex-end" space={1}>
              <Button
                varient="outlined"
                color="info"
                type="button"
                onClick={() => navigate("/proposal/list")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? mode === "edit" ? "Saving…" : "Creating…"
                  : mode === "edit" ? "Save Changes" : "Create Proposal"}
              </Button>
            </Box>

          </Box>
        </form>

      </Box>
    </Card>
  );
};

const ProposalForm = ({ mode, id }: ProposalFormProps) => {
  const { data, isLoading } = useGetProposalByIdQuery(id!, { skip: mode !== "edit" || !id });

  if (mode === "edit" && isLoading) {
    return (
      <Card py="2rem" px="2rem">
        <Box style={{ maxWidth: 720, margin: "0 auto" }}>
          <Text varient="body2" secondary>Loading…</Text>
        </Box>
      </Card>
    );
  }

  return <ProposalFormInner mode={mode} id={id} initialData={data} />;
};

export default ProposalForm;
