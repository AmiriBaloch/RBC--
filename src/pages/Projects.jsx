import { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Modal, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { FaEye, FaPencilAlt, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Applicants.css'; // Reusing the same CSS

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    sector: '',
    description: '',
    conclusion: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Try to get all projects without ordering first
      let projectsQuery = query(
        collection(db, 'posts')
      );
      
      console.log("Attempting to fetch all projects without ordering...");
      let querySnapshot = await getDocs(projectsQuery);
      console.log("Query completed, documents:", querySnapshot.size);
      
      // If no documents found, try with ordering
      if (querySnapshot.empty) {
        console.log("No documents found without ordering, trying with createdAt ordering...");
        projectsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(projectsQuery);
      }
      
      const projectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt || Date.now())
      }));
      
      // Sort the projects by date in memory if possible
      projectsData.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log("Projects data processed:", projectsData.length);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      console.error('Error details:', error.code, error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to fetch projects: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = () => {
    setFormData({
      title: '',
      type: '',
      sector: '',
      description: '',
      conclusion: ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleViewProject = (project) => {
    setCurrentProject(project);
    setShowViewModal(true);
  };

  const handleEditProject = (project) => {
    setCurrentProject(project);
    setFormData({
      title: project.title || '',
      type: project.type || '',
      sector: project.sector || '',
      description: project.description || '',
      conclusion: project.conclusion || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description?.trim()) {
      errors.description = 'Description is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await addDoc(collection(db, 'posts'), {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timestamp: Date.now()
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Post added successfully'
      });
      
      fetchProjects();
      setShowAddModal(false);
      
    } catch (error) {
      console.error('Error adding post:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add post'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await updateDoc(doc(db, 'posts', currentProject.id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Post updated successfully'
      });
      
      fetchProjects();
      setShowEditModal(false);
      
    } catch (error) {
      console.error('Error updating post:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update post'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (project) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });
      
      if (result.isConfirmed) {
        await deleteDoc(doc(db, 'posts', project.id));
        
        Swal.fire(
          'Deleted!',
          'Post has been deleted.',
          'success'
        );
        
        fetchProjects();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete post'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredProjects = projects.filter(project => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (project.title?.toLowerCase().includes(searchLower)) ||
      (project.type?.toLowerCase().includes(searchLower)) ||
      (project.sector?.toLowerCase().includes(searchLower)) ||
      (project.description?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="applicants-page">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <Button variant="primary" onClick={handleAddProject}>
          <FaPlus className="me-2" /> Add New Project
        </Button>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="search-box mb-4">
            <FaSearch className="search-icon" />
            <Form.Control
              type="text"
              placeholder="Search projects by title, type, sector or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="applicants-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Sector</th>
                    <th>Posted Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => (
                    <tr key={project.id}>
                      <td>{project.title}</td>
                      <td>{project.type || '-'}</td>
                      <td>{project.sector || '-'}</td>
                      <td>{formatDate(project.createdAt)}</td>
                      <td>
                        <div className="action-buttons-container">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="action-button"
                            onClick={() => handleViewProject(project)}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="action-button"
                            onClick={() => handleEditProject(project)}
                          >
                            <FaPencilAlt />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="action-button"
                            onClick={() => handleDeleteProject(project)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">No projects found</p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* View Project Modal */}
      {currentProject && (
        <Modal 
          show={showViewModal} 
          onHide={() => setShowViewModal(false)} 
          centered
          size="lg"
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>{currentProject.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="project-detail">
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Type:</strong> {currentProject.type || 'Not specified'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Sector:</strong> {currentProject.sector || 'Not specified'}</p>
                </Col>
              </Row>
              
              <h6 className="text-primary mb-3">DESCRIPTION:</h6>
              <div className="p-3 bg-light rounded mb-4">
                <p style={{ whiteSpace: 'pre-line' }}>{currentProject.description}</p>
              </div>
              
              {currentProject.conclusion && (
                <>
                  <h6 className="text-primary mb-3">CONCLUSION:</h6>
                  <div className="p-3 bg-light rounded mb-4">
                    <p style={{ whiteSpace: 'pre-line' }}>{currentProject.conclusion}</p>
                  </div>
                </>
              )}
              
              <p className="text-muted mt-3">
                <small>Posted: {formatDate(currentProject.createdAt)}</small>
                {currentProject.updatedAt && (
                  <small className="ms-3">Last updated: {formatDate(currentProject.updatedAt)}</small>
                )}
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setShowViewModal(false);
                handleEditProject(currentProject);
              }}
            >
              Edit
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      
      {/* Add Project Modal */}
      <Modal 
        show={showAddModal} 
        onHide={() => setShowAddModal(false)} 
        centered 
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Project</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title*</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                isInvalid={!!formErrors.title}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.title}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    placeholder="e.g. Literacy and Skill Development Initiative"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sector</Form.Label>
                  <Form.Control
                    type="text"
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    placeholder="e.g. Education, Healthcare, Agriculture"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description*</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="description"
                value={formData.description}
                onChange={handleChange}
                isInvalid={!!formErrors.description}
                placeholder="Provide detailed description of the project, its goals, and implementation details."
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Conclusion</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="conclusion"
                value={formData.conclusion}
                onChange={handleChange}
                placeholder="Summarize the impact and outcomes of the project."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Adding...
                </>
              ) : (
                'Add Project'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Edit Project Modal */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        centered 
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Project</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title*</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                isInvalid={!!formErrors.title}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.title}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    placeholder="e.g. Literacy and Skill Development Initiative"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sector</Form.Label>
                  <Form.Control
                    type="text"
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    placeholder="e.g. Education, Healthcare, Agriculture"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description*</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="description"
                value={formData.description}
                onChange={handleChange}
                isInvalid={!!formErrors.description}
                placeholder="Provide detailed description of the project, its goals, and implementation details."
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Conclusion</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="conclusion"
                value={formData.conclusion}
                onChange={handleChange}
                placeholder="Summarize the impact and outcomes of the project."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects; 