import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../card/Card";
import Box from "../../box/Box";
import { GridInnerContainer, GridItem } from "../../layout";
import { Text, TextField, Button, Divider, Select, SelectItem } from "../../../ui";
import {
  useGetLeadByIdQuery,
  useUpdateLeadMutation,
} from "../../../store/leads/leadsApi";
import { useToast } from "../../../context/toast/ToastContext";
import parseServerError from "../../../utils/parseServerError";
import type { ApiLeadStatus, ApiClientType, LeadItem } from "../../../store/leads/types/definition";

interface LeadFormProps {
  id: string;
}

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    varient="caption"
    weight="medium"
    secondary
    styles={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
  >
    {children}
  </Text>
);

interface FormFields {
  firstName: string;
  lastName: string;
  companyName: string;
  status: ApiLeadStatus;
  clientType: ApiClientType | "";
  rate: string;
  location: string;
}

const toFormValues = (data: LeadItem): FormFields => ({
  firstName:   data.firstName   ?? "",
  lastName:    data.lastName    ?? "",
  companyName: data.companyName ?? "",
  status:      data.status,
  clientType:  data.clientType  ?? "",
  rate:        data.rate != null ? String(data.rate) : "",
  location:    data.location    ?? "",
});

const LeadFormInner = ({ id, initialData }: { id: string; initialData: LeadItem }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [fields, setFields] = useState<FormFields>(toFormValues(initialData));
  const [updateLead, { isLoading }] = useUpdateLeadMutation();

  const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const body: Partial<LeadItem> = {
        firstName:   fields.firstName   || null,
        lastName:    fields.lastName    || null,
        companyName: fields.clientType === "company" ? (fields.companyName || null) : null,
        status:      fields.status,
        clientType:  fields.clientType  || null,
        rate:        fields.rate !== "" ? Number(fields.rate) : null,
        location:    fields.location    || null,
      };
      await updateLead({ id, body }).unwrap();
      showToast("Lead updated successfully", "success");
      navigate(`/leads/preview/${id}`);
    } catch (err) {
      showToast(parseServerError(err), "error");
    }
  };

  return (
    <Card py="2rem" px="2rem">
      <Box style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <Box mb={5}>
          <Text heading="h5">Edit Lead #{initialData.number}</Text>
          <Box mt={1}>
            <Text varient="body2" secondary>
              Update the lead details below
            </Text>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" space={2}>

            {/* ── Lead Info ── */}
            <Box display="flex" flexDirection="column" space={3}>
              <SectionLabel>Lead Info</SectionLabel>
              <GridInnerContainer spacing={2}>

                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">First Name</Text>
                    <TextField
                      name="firstName"
                      placeholder="e.g. John"
                      value={fields.firstName}
                      onChange={(e) => setField("firstName", e.target.value)}
                      width="100%"
                    />
                  </Box>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Last Name</Text>
                    <TextField
                      name="lastName"
                      placeholder="e.g. Doe"
                      value={fields.lastName}
                      onChange={(e) => setField("lastName", e.target.value)}
                      width="100%"
                    />
                  </Box>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Location</Text>
                    <TextField
                      name="location"
                      placeholder="e.g. United States"
                      value={fields.location}
                      onChange={(e) => setField("location", e.target.value)}
                      width="100%"
                    />
                  </Box>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Status</Text>
                    <Select
                      label="Select status"
                      defaultValue={fields.status}
                      onChange={(value) => setField("status", value as ApiLeadStatus)}
                      width="100%"
                      sizes="normal"
                    >
                      <SelectItem label="Conversation Ongoing" value="conversation_ongoing" />
                      <SelectItem label="Trial"                value="trial" />
                      <SelectItem label="Hold"                 value="hold" />
                      <SelectItem label="Contract Offer"       value="contract_offer" />
                      <SelectItem label="Accept Contract"      value="accept_contract" />
                      <SelectItem label="Start Contract"       value="start_contract" />
                      <SelectItem label="Suspended"            value="suspended" />
                    </Select>
                  </Box>
                </GridItem>

                <GridItem xs={12} md={6}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Client Type</Text>
                    <Select
                      label="Select client type"
                      defaultValue={fields.clientType}
                      onChange={(value) => setField("clientType", value as ApiClientType | "")}
                      width="100%"
                      sizes="normal"
                    >
                      <SelectItem label="Individual" value="individual" />
                      <SelectItem label="Company"    value="company" />
                    </Select>
                  </Box>
                </GridItem>

                <GridItem xs={12} md={6}>
                  {fields.clientType === "company" && (
                    <Box display="flex" flexDirection="column" space={1}>
                      <Text varient="body2" weight="medium">Company Name</Text>
                      <TextField
                        name="companyName"
                        placeholder="e.g. Acme Corp"
                        value={fields.companyName}
                        onChange={(e) => setField("companyName", e.target.value)}
                        width="100%"
                      />
                    </Box>
                  )}
                </GridItem>

              </GridInnerContainer>
            </Box>

            <Divider />

            {/* ── Financial ── */}
            <Box display="flex" flexDirection="column" space={3}>
              <SectionLabel>Financial</SectionLabel>
              <GridInnerContainer spacing={2}>

                <GridItem xs={12} md={4}>
                  <Box display="flex" flexDirection="column" space={1}>
                    <Text varient="body2" weight="medium">Hourly Rate ($)</Text>
                    <TextField
                      name="rate"
                      type="number"
                      placeholder="e.g. 50"
                      value={fields.rate}
                      onChange={(e) => setField("rate", e.target.value)}
                      width="100%"
                      minValue={0}
                    />
                  </Box>
                </GridItem>

              </GridInnerContainer>
            </Box>

            {/* ── Actions ── */}
            <Box display="flex" justify="flex-end" space={1}>
              <Button
                varient="outlined"
                color="info"
                type="button"
                onClick={() => navigate(`/leads/preview/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving…" : "Save Changes"}
              </Button>
            </Box>

          </Box>
        </form>

      </Box>
    </Card>
  );
};

const LeadForm = ({ id }: LeadFormProps) => {
  const { data, isLoading } = useGetLeadByIdQuery(id, { skip: !id });

  if (isLoading) {
    return (
      <Card py="2rem" px="2rem">
        <Box style={{ maxWidth: 720, margin: "0 auto" }}>
          <Text varient="body2" secondary>Loading…</Text>
        </Box>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card py="2rem" px="2rem">
        <Box style={{ maxWidth: 720, margin: "0 auto" }}>
          <Text varient="body2" secondary>Lead not found</Text>
        </Box>
      </Card>
    );
  }

  return <LeadFormInner id={id} initialData={data} />;
};

export default LeadForm;
