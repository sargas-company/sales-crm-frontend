import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowBackOutlined,
  PersonOutlined,
  BusinessOutlined,
  PhoneOutlined,
  EmailOutlined,
  MessageOutlined,
  CalendarTodayOutlined,
  BuildOutlined,
  InsertDriveFileOutlined,
  VisibilityOutlined,
  FileDownloadOutlined,
} from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import Box from '../../../components/box/Box'
import Card from '../../../components/card/Card'
import { Text, Divider, IconButton, Button } from '../../../ui'
import { GridInnerContainer, GridItem } from '../../../components/layout'
import { useGetClientRequestByIdQuery } from '../../../store/clientRequests/clientRequestsApi'
import ClientRequestStatusSelect from '../../../components/client-requests/preview/ClientRequestStatusSelect'
import { formatDate } from '../../../utils/formatDate'
import { API_BASE_URL } from '../../../api/baseApi'
import type { ClientRequestFile } from '../../../store/clientRequests/types/definition'

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    varient="caption"
    weight="medium"
    secondary
    styles={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
  >
    {children}
  </Text>
)

const InfoRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) => (
  <Box display="flex" align="flex-start" space={2} style={{ minHeight: 36 }}>
    <Box
      display="flex"
      align="center"
      space={1}
      style={{ minWidth: 160, color: 'var(--text-secondary, #8A8D93)' }}
    >
      {icon}
      <Text varient="body2" secondary>
        {label}
      </Text>
    </Box>
    <Box>{children}</Box>
  </Box>
)

const fileUrl = (file: ClientRequestFile) =>
  `${API_BASE_URL}/${file.path}`

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ClientRequestPreview = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: request, isLoading, isError } = useGetClientRequestByIdQuery(id!, { skip: !id })

  if (isLoading) {
    return (
      <Card py="2rem" px="2rem">
        <Box style={{ maxWidth: 900, margin: '0 auto' }}>
          <Text secondary>Loading…</Text>
        </Box>
      </Card>
    )
  }

  if (isError || !request) {
    return (
      <Card py="2rem" px="2rem">
        <Box style={{ maxWidth: 900, margin: '0 auto' }} display="flex" flexDirection="column" align="center" space={3}>
          <Text heading="h6">Client request not found</Text>
          <Button varient="outlined" color="info" onClick={() => navigate('/client-requests/list/')}>
            Back to list
          </Button>
        </Box>
      </Card>
    )
  }

  return (
    <Card py="2rem" px="2rem">
      <Box style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <Box display="flex" flexDirection="column" space={2} mb={30}>
          <Box display="flex" align="center" space={3}>
            <IconButton varient="text" size={34} fontSize={20} onClick={() => navigate('/client-requests/list/')}>
              <ArrowBackOutlined />
            </IconButton>
            <Box>
              <Text heading="h5">{request.name || 'Client Request'}</Text>
              <Text varient="caption" secondary>
                {request.company} · {formatDate(request.createdAt)}
              </Text>
            </Box>
          </Box>

          <Box display="flex" align="center">
            <ClientRequestStatusSelect id={request.id} status={request.status} />
          </Box>
        </Box>

        {/* Details */}
        <Box display="flex" flexDirection="column" space={3}>
          <SectionLabel>Details</SectionLabel>
          <GridInnerContainer spacing={1}>

            <GridItem xs={12} md={6}>
              <InfoRow icon={<PersonOutlined style={{ fontSize: 18 }} />} label="Name">
                <Text varient="body2">{request.name || '—'}</Text>
              </InfoRow>
            </GridItem>

            <GridItem xs={12} md={6}>
              <InfoRow icon={<BusinessOutlined style={{ fontSize: 18 }} />} label="Company">
                <Text varient="body2">{request.company || '—'}</Text>
              </InfoRow>
            </GridItem>

            <GridItem xs={12} md={6}>
              <InfoRow icon={<PhoneOutlined style={{ fontSize: 18 }} />} label="Phone">
                <Text varient="body2">{request.phone || '—'}</Text>
              </InfoRow>
            </GridItem>

            <GridItem xs={12} md={6}>
              <InfoRow icon={<CalendarTodayOutlined style={{ fontSize: 18 }} />} label="Created At">
                <Text varient="body2">{formatDate(request.createdAt)}</Text>
              </InfoRow>
            </GridItem>

            <GridItem xs={12}>
              <InfoRow icon={<BuildOutlined style={{ fontSize: 18 }} />} label="Services">
                <Box display="flex" flexDirection="column" space={1}>
                  {request.services?.length
                    ? request.services.map((s) => <Text key={s} varient="body2">· {s}</Text>)
                    : <Text varient="body2">—</Text>
                  }
                </Box>
              </InfoRow>
            </GridItem>

            <GridItem xs={12}>
              <InfoRow icon={<MessageOutlined style={{ fontSize: 18 }} />} label="Message">
                <Text varient="body2" styles={{ whiteSpace: 'pre-wrap' }}>
                  {request.message || '—'}
                </Text>
              </InfoRow>
            </GridItem>

          </GridInnerContainer>
        </Box>

        {/* Files */}
        {request.files?.length > 0 && (
          <>
            <Box mx={5} my={30}>
              <Divider />
            </Box>

            <Box display="flex" flexDirection="column" space={2}>
              <SectionLabel>Files</SectionLabel>
              <Box display="flex" flexDirection="column" space={2}>
                {request.files.map((file) => (
                  <Box
                    key={file.fileName}
                    display="flex"
                    align="center"
                    justify="space-between"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color, #E0E0E0)',
                    }}
                  >
                    <Box display="flex" align="center" space={2}>
                      <InsertDriveFileOutlined style={{ fontSize: 22, color: '#8A8D93' }} />
                      <Box display={'flex'} space={1} align={'center'}>
                        <Text varient="body2">{file.originalName}</Text>
                        <Text varient="caption" secondary>
                          {formatSize(file.size)}
                        </Text>
                      </Box>
                    </Box>

                    <Box display="flex" align="center" space={1}>
                      <Tooltip title="View" placement="top">
                        <span>
                          <IconButton
                            varient="text"
                            size={32}
                            fontSize={18}
                            onClick={() => window.open(fileUrl(file), '_blank', 'noopener,noreferrer')}
                          >
                            <VisibilityOutlined style={{ fontSize: 18 }} />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Download" placement="top">
                        <a
                          href={fileUrl(file)}
                          download={file.originalName}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconButton varient="text" size={32} fontSize={18}>
                            <FileDownloadOutlined style={{ fontSize: 18 }} />
                          </IconButton>
                        </a>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}

      </Box>
    </Card>
  )
}

export default ClientRequestPreview
